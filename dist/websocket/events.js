// WebSocket event names
export const WS_EVENTS = {
    // Connection/auth
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    AUTHENTICATE: 'authenticate',
    AUTHENTICATED: 'authenticated',
    AUTH_ERROR: 'auth_error',
    // Document ingestion
    DOCUMENT_UPLOAD_START: 'document:upload:start',
    DOCUMENT_UPLOAD_PROGRESS: 'document:upload:progress',
    DOCUMENT_UPLOAD_COMPLETE: 'document:upload:complete',
    DOCUMENT_PROCESSING_START: 'document:processing:start',
    DOCUMENT_PROCESSING_PROGRESS: 'document:processing:progress',
    DOCUMENT_PROCESSING_COMPLETE: 'document:processing:complete',
    DOCUMENT_PROCESSING_ERROR: 'document:processing:error',
    // Chat
    CHAT_MESSAGE_SEND: 'chat:message:send',
    CHAT_MESSAGE_RECEIVED: 'chat:message:received',
    CHAT_RESPONSE_START: 'chat:response:start',
    CHAT_RESPONSE_CHUNK: 'chat:response:chunk',
    CHAT_RESPONSE_COMPLETE: 'chat:response:complete',
    CHAT_ERROR: 'chat:error',
    // Notifications
    NOTIFICATION: 'notification',
    ERROR: 'error',
};
//# sourceMappingURL=events.js.map