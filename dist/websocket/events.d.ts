export declare const WS_EVENTS: {
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly AUTHENTICATE: "authenticate";
    readonly AUTHENTICATED: "authenticated";
    readonly AUTH_ERROR: "auth_error";
    readonly DOCUMENT_UPLOAD_START: "document:upload:start";
    readonly DOCUMENT_UPLOAD_PROGRESS: "document:upload:progress";
    readonly DOCUMENT_UPLOAD_COMPLETE: "document:upload:complete";
    readonly DOCUMENT_PROCESSING_START: "document:processing:start";
    readonly DOCUMENT_PROCESSING_PROGRESS: "document:processing:progress";
    readonly DOCUMENT_PROCESSING_COMPLETE: "document:processing:complete";
    readonly DOCUMENT_PROCESSING_ERROR: "document:processing:error";
    readonly CHAT_MESSAGE_SEND: "chat:message:send";
    readonly CHAT_MESSAGE_RECEIVED: "chat:message:received";
    readonly CHAT_RESPONSE_START: "chat:response:start";
    readonly CHAT_RESPONSE_CHUNK: "chat:response:chunk";
    readonly CHAT_RESPONSE_COMPLETE: "chat:response:complete";
    readonly CHAT_ERROR: "chat:error";
    readonly NOTIFICATION: "notification";
    readonly ERROR: "error";
};
export interface DocumentUploadEvent {
    documentId: string;
    fileName: string;
    fileSize: number;
}
export interface DocumentProgressEvent {
    documentId: string;
    progress: number;
    status: 'processing' | 'completed' | 'failed';
    message?: string;
}
export interface ChatMessageEvent {
    conversationId: string;
    content: string;
    metadata?: Record<string, unknown>;
}
export interface ChatResponseEvent {
    conversationId: string;
    content: string;
    citations?: Array<{
        text: string;
        source: string;
        relevance: number;
    }>;
}
export interface NotificationEvent {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=events.d.ts.map