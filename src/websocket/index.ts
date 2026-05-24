import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getLogger } from '../core/logger/index.js';
import { AuthenticationError } from '../core/errors/index.js';
import { verifyAccessToken } from '../modules/auth/token.service.js';
import { WS_EVENTS, DocumentProgressEvent, ChatResponseEvent } from './events.js';

const logger = getLogger();

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

export let io: SocketIOServer | null = null;

const activeConnections = new Map<string, Set<string>>(); // userId -> Set<socketIds>

export const initializeWebSocket = (httpServer: HTTPServer, origin?: string): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: origin || '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token as string;

      if (!token) {
        return next(new AuthenticationError('No token provided'));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.email = decoded.email;

      logger.info({ userId: decoded.userId, socketId: socket.id }, 'WebSocket authenticated');
      next();
    } catch (error) {
      logger.warn({ err: error }, 'WebSocket authentication failed');
      next(new AuthenticationError('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      socket.disconnect();
      return;
    }

    logger.info({ userId: socket.userId, socketId: socket.id }, 'WebSocket connected');

    // Track active connections
    if (!activeConnections.has(socket.userId)) {
      activeConnections.set(socket.userId, new Set());
    }
    activeConnections.get(socket.userId)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Emit authentication success
    socket.emit(WS_EVENTS.AUTHENTICATED, {
      userId: socket.userId,
      email: socket.email,
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info({ userId: socket.userId, socketId: socket.id }, 'WebSocket disconnected');

      const connections = activeConnections.get(socket.userId!);
      if (connections) {
        connections.delete(socket.id);
        if (connections.size === 0) {
          activeConnections.delete(socket.userId!);
        }
      }
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error({ userId: socket.userId, err: error }, 'WebSocket error');
      socket.emit(WS_EVENTS.ERROR, {
        type: 'error',
        message: 'WebSocket error occurred',
      });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

export const getWebSocket = (): SocketIOServer => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export const emitDocumentProgress = (
  userId: string,
  documentId: string,
  progress: DocumentProgressEvent
): void => {
  emitToUser(userId, WS_EVENTS.DOCUMENT_PROCESSING_PROGRESS, {
    ...progress,
    documentId,
  });
};

export const emitChatResponse = (
  conversationId: string,
  userId: string,
  chunk: ChatResponseEvent
): void => {
  emitToUser(userId, WS_EVENTS.CHAT_RESPONSE_CHUNK, chunk);
};

export const emitNotification = (
  userId: string,
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  metadata?: Record<string, unknown>
): void => {
  emitToUser(userId, WS_EVENTS.NOTIFICATION, {
    type,
    message,
    timestamp: new Date(),
    metadata,
  });
};

export const broadcastToUser = (userId: string, event: string, data: any): void => {
  const connections = activeConnections.get(userId);
  if (connections && io) {
    connections.forEach(socketId => {
      const socket = io!.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    });
  }
};
