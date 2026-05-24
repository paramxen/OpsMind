import { Server as SocketIOServer } from 'socket.io';
import { getLogger } from '../core/logger/index.js';
import { AuthenticationError } from '../core/errors/index.js';
import { verifyAccessToken } from '../modules/auth/token.service.js';
import { WS_EVENTS } from './events.js';
const logger = getLogger();
export let io = null;
const activeConnections = new Map(); // userId -> Set<socketIds>
export const initializeWebSocket = (httpServer, origin) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: origin || '*',
            credentials: true,
            methods: ['GET', 'POST'],
        },
    });
    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new AuthenticationError('No token provided'));
            }
            const decoded = verifyAccessToken(token);
            socket.userId = decoded.userId;
            socket.email = decoded.email;
            logger.info({ userId: decoded.userId, socketId: socket.id }, 'WebSocket authenticated');
            next();
        }
        catch (error) {
            logger.warn({ err: error }, 'WebSocket authentication failed');
            next(new AuthenticationError('Invalid token'));
        }
    });
    // Connection handler
    io.on('connection', (socket) => {
        if (!socket.userId) {
            socket.disconnect();
            return;
        }
        logger.info({ userId: socket.userId, socketId: socket.id }, 'WebSocket connected');
        // Track active connections
        if (!activeConnections.has(socket.userId)) {
            activeConnections.set(socket.userId, new Set());
        }
        activeConnections.get(socket.userId).add(socket.id);
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
            const connections = activeConnections.get(socket.userId);
            if (connections) {
                connections.delete(socket.id);
                if (connections.size === 0) {
                    activeConnections.delete(socket.userId);
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
export const getWebSocket = () => {
    if (!io) {
        throw new Error('WebSocket not initialized');
    }
    return io;
};
export const emitToUser = (userId, event, data) => {
    if (!io)
        return;
    io.to(`user:${userId}`).emit(event, data);
};
export const emitDocumentProgress = (userId, documentId, progress) => {
    emitToUser(userId, WS_EVENTS.DOCUMENT_PROCESSING_PROGRESS, {
        ...progress,
        documentId,
    });
};
export const emitChatResponse = (conversationId, userId, chunk) => {
    emitToUser(userId, WS_EVENTS.CHAT_RESPONSE_CHUNK, chunk);
};
export const emitNotification = (userId, type, message, metadata) => {
    emitToUser(userId, WS_EVENTS.NOTIFICATION, {
        type,
        message,
        timestamp: new Date(),
        metadata,
    });
};
export const broadcastToUser = (userId, event, data) => {
    const connections = activeConnections.get(userId);
    if (connections && io) {
        connections.forEach(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit(event, data);
            }
        });
    }
};
//# sourceMappingURL=index.js.map