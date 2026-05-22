import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../../core/logger/index.js';
import { ValidationError, NotFoundError } from '../../core/errors/index.js';
import { requireAuth } from '../auth/middleware.js';
import { generateChatResponse, } from './chat.service.js';
import { createConversation, getConversationById, getUserConversations, deleteConversation, addMessage, getConversationMessages, getRecentConversationHistory, } from './conversation.service.js';
import { getDocumentsByUserId } from '../documents/document.service.js';
import { CreateConversationSchema, SendMessageSchema, PaginationSchema, } from '../../validations/index.js';
const router = Router();
const logger = getLogger();
// Create conversation
export const createConv = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new ValidationError('User not authenticated');
        }
        const input = CreateConversationSchema.parse(req.body);
        // Verify documents belong to user
        const { documents } = await getDocumentsByUserId(req.user.userId, { page: 1, limit: 1000 });
        const userDocIds = documents.map((d) => d.documentId);
        for (const docId of input.documentIds) {
            if (!userDocIds.includes(docId)) {
                throw new ValidationError('One or more documents do not belong to you');
            }
        }
        const conversationId = uuidv4();
        const conversation = await createConversation(conversationId, req.user.userId, input.title, input.documentIds);
        logger.info({ conversationId, userId: req.user.userId }, 'Conversation created');
        const response = {
            success: true,
            data: { conversation },
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Get conversations
export const getConversations = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new ValidationError('User not authenticated');
        }
        const pagination = PaginationSchema.parse(req.query);
        const { conversations, total } = await getUserConversations(req.user.userId, pagination);
        const response = {
            success: true,
            data: {
                conversations,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    pages: Math.ceil(total / pagination.limit),
                },
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Send message
export const sendMessage = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new ValidationError('User not authenticated');
        }
        const input = SendMessageSchema.parse(req.body);
        // Get conversation
        const conversation = await getConversationById(input.conversationId, req.user.userId);
        if (!conversation) {
            throw new NotFoundError('Conversation');
        }
        // Get conversation history
        const history = await getRecentConversationHistory(input.conversationId, 10);
        const chatHistory = history.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        // Add user message
        const userMessageId = uuidv4();
        await addMessage(userMessageId, input.conversationId, 'user', input.content);
        // Generate response
        const chatResponse = await generateChatResponse(input.content, conversation.documentIds, chatHistory);
        // Add assistant message
        const assistantMessageId = uuidv4();
        await addMessage(assistantMessageId, input.conversationId, 'assistant', chatResponse.message, chatResponse.citations?.map((c) => ({
            documentId: c.documentId,
            documentName: c.documentName,
            text: c.text,
        })));
        logger.info({ conversationId: input.conversationId }, 'Message sent');
        const response = {
            success: true,
            data: {
                message: chatResponse.message,
                citations: chatResponse.citations,
                metadata: chatResponse.metadata,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Get conversation messages
export const getMessages = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new ValidationError('User not authenticated');
        }
        const conversationId = Array.isArray(req.params.conversationId)
            ? req.params.conversationId[0]
            : (req.params.conversationId || '');
        const pagination = PaginationSchema.parse(req.query);
        // Verify conversation belongs to user
        const conversation = await getConversationById(conversationId, req.user.userId);
        if (!conversation) {
            throw new NotFoundError('Conversation');
        }
        const { messages, total } = await getConversationMessages(conversationId, pagination);
        const response = {
            success: true,
            data: {
                messages,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    pages: Math.ceil(total / pagination.limit),
                },
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Delete conversation
export const deleteConv = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new ValidationError('User not authenticated');
        }
        const conversationId = Array.isArray(req.params.conversationId)
            ? req.params.conversationId[0]
            : (req.params.conversationId || '');
        await deleteConversation(conversationId, req.user.userId);
        logger.info({ conversationId }, 'Conversation deleted');
        const response = {
            success: true,
            data: { message: 'Conversation deleted' },
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Setup routes
router.post('/', requireAuth, createConv);
router.get('/', requireAuth, getConversations);
router.get('/:conversationId/messages', requireAuth, getMessages);
router.delete('/:conversationId', requireAuth, deleteConv);
router.post('/:conversationId/messages', requireAuth, sendMessage);
export default router;
//# sourceMappingURL=routes.js.map