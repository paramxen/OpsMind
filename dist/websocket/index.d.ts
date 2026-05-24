import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { DocumentProgressEvent, ChatResponseEvent } from './events.js';
export interface AuthenticatedSocket extends Socket {
    userId?: string;
    email?: string;
}
export declare let io: SocketIOServer | null;
export declare const initializeWebSocket: (httpServer: HTTPServer, origin?: string) => SocketIOServer;
export declare const getWebSocket: () => SocketIOServer;
export declare const emitToUser: (userId: string, event: string, data: any) => void;
export declare const emitDocumentProgress: (userId: string, documentId: string, progress: DocumentProgressEvent) => void;
export declare const emitChatResponse: (conversationId: string, userId: string, chunk: ChatResponseEvent) => void;
export declare const emitNotification: (userId: string, type: "info" | "success" | "warning" | "error", message: string, metadata?: Record<string, unknown>) => void;
export declare const broadcastToUser: (userId: string, event: string, data: any) => void;
//# sourceMappingURL=index.d.ts.map