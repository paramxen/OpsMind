import { ConversationData, MessageData, PaginationInput } from '../../types/index.js';
export declare const createConversation: (conversationId: string, userId: string, title: string, documentIds: string[]) => Promise<ConversationData>;
export declare const getConversationById: (conversationId: string, userId: string) => Promise<ConversationData | null>;
export declare const getUserConversations: (userId: string, pagination: PaginationInput) => Promise<{
    conversations: ConversationData[];
    total: number;
}>;
export declare const updateConversation: (conversationId: string, userId: string, updates: Partial<ConversationData>) => Promise<void>;
export declare const deleteConversation: (conversationId: string, userId: string) => Promise<void>;
export declare const addMessage: (messageId: string, conversationId: string, role: "user" | "assistant", content: string, citations?: Array<{
    documentId: string;
    documentName: string;
    text: string;
}>) => Promise<MessageData>;
export declare const getConversationMessages: (conversationId: string, pagination: PaginationInput) => Promise<{
    messages: MessageData[];
    total: number;
}>;
export declare const getRecentConversationHistory: (conversationId: string, limit?: number) => Promise<MessageData[]>;
//# sourceMappingURL=conversation.service.d.ts.map