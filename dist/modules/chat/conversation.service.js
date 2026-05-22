import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { NotFoundError } from '../../core/errors/index.js';
const logger = getLogger();
export const createConversation = async (conversationId, userId, title, documentIds) => {
    const db = getDatabase();
    const collection = db.collection('conversations');
    const conversation = {
        conversationId,
        userId,
        title,
        documentIds,
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    await collection.insertOne(conversation);
    logger.info({ conversationId, userId }, 'Conversation created');
    return conversation;
};
export const getConversationById = async (conversationId, userId) => {
    const db = getDatabase();
    const collection = db.collection('conversations');
    return collection.findOne({ conversationId, userId });
};
export const getUserConversations = async (userId, pagination) => {
    const db = getDatabase();
    const collection = db.collection('conversations');
    const skip = (pagination.page - 1) * pagination.limit;
    const [conversations, total] = await Promise.all([
        collection
            .find({ userId })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(pagination.limit)
            .toArray(),
        collection.countDocuments({ userId }),
    ]);
    return { conversations, total };
};
export const updateConversation = async (conversationId, userId, updates) => {
    const db = getDatabase();
    const collection = db.collection('conversations');
    const result = await collection.updateOne({ conversationId, userId }, {
        $set: {
            ...updates,
            updatedAt: new Date(),
        },
    });
    if (result.matchedCount === 0) {
        throw new NotFoundError('Conversation');
    }
    logger.debug({ conversationId }, 'Conversation updated');
};
export const deleteConversation = async (conversationId, userId) => {
    const db = getDatabase();
    const conversationCollection = db.collection('conversations');
    const messageCollection = db.collection('messages');
    // Delete conversation
    const result = await conversationCollection.deleteOne({ conversationId, userId });
    if (result.deletedCount === 0) {
        throw new NotFoundError('Conversation');
    }
    // Delete associated messages
    await messageCollection.deleteMany({ conversationId });
    logger.info({ conversationId }, 'Conversation deleted');
};
export const addMessage = async (messageId, conversationId, role, content, citations) => {
    const db = getDatabase();
    const messageCollection = db.collection('messages');
    const conversationCollection = db.collection('conversations');
    const message = {
        messageId,
        conversationId,
        role,
        content,
        citations: citations?.map((c) => ({
            documentId: c.documentId,
            documentName: c.documentName,
            chunkId: '',
            relevanceScore: 0.9,
            text: c.text,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    await messageCollection.insertOne(message);
    // Update conversation message count and last updated time
    await conversationCollection.updateOne({ conversationId }, {
        $inc: { messageCount: 1 },
        $set: { updatedAt: new Date() },
    });
    logger.debug({ messageId, conversationId }, 'Message added');
    return message;
};
export const getConversationMessages = async (conversationId, pagination) => {
    const db = getDatabase();
    const collection = db.collection('messages');
    const skip = (pagination.page - 1) * pagination.limit;
    const [messages, total] = await Promise.all([
        collection
            .find({ conversationId })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(pagination.limit)
            .toArray(),
        collection.countDocuments({ conversationId }),
    ]);
    return { messages, total };
};
export const getRecentConversationHistory = async (conversationId, limit = 10) => {
    const db = getDatabase();
    const collection = db.collection('messages');
    return collection
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
        .then((msgs) => msgs.reverse()); // Return in chronological order
};
//# sourceMappingURL=conversation.service.js.map