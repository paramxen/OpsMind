import { Citation } from '../../types/index.js';
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface ChatResponse {
    message: string;
    citations: Citation[];
    metadata?: {
        tokensUsed?: number;
        responseTime?: number;
    };
}
export declare const generateChatResponse: (userMessage: string, documentIds: string[], conversationHistory?: ChatMessage[]) => Promise<ChatResponse>;
export declare const streamChatResponse: (userMessage: string, documentIds: string[], onChunk: (chunk: string) => void, conversationHistory?: ChatMessage[]) => Promise<ChatResponse>;
//# sourceMappingURL=chat.service.d.ts.map