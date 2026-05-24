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
} as const;

export interface DocumentUploadEvent {
  documentId: string;
  fileName: string;
  fileSize: number;
}

export interface DocumentProgressEvent {
  documentId: string;
  progress: number; // 0-100
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
