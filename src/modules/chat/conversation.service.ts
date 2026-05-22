import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { NotFoundError } from '../../core/errors/index.js';
import { ConversationData, MessageData, PaginationInput } from '../../types/index.js';

const logger = getLogger();

export const createConversation = async (
  conversationId: string,
  userId: string,
  title: string,
  documentIds: string[]
): Promise<ConversationData> => {
  const db = getDatabase();
  const collection = db.collection<ConversationData>('conversations');

  const conversation: ConversationData = {
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

export const getConversationById = async (
  conversationId: string,
  userId: string
): Promise<ConversationData | null> => {
  const db = getDatabase();
  const collection = db.collection<ConversationData>('conversations');

  return collection.findOne({ conversationId, userId });
};

export const getUserConversations = async (
  userId: string,
  pagination: PaginationInput
): Promise<{ conversations: ConversationData[]; total: number }> => {
  const db = getDatabase();
  const collection = db.collection<ConversationData>('conversations');

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

export const updateConversation = async (
  conversationId: string,
  userId: string,
  updates: Partial<ConversationData>
): Promise<void> => {
  const db = getDatabase();
  const collection = db.collection<ConversationData>('conversations');

  const result = await collection.updateOne(
    { conversationId, userId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError('Conversation');
  }

  logger.debug({ conversationId }, 'Conversation updated');
};

export const deleteConversation = async (conversationId: string, userId: string): Promise<void> => {
  const db = getDatabase();
  const conversationCollection = db.collection<ConversationData>('conversations');
  const messageCollection = db.collection<MessageData>('messages');

  // Delete conversation
  const result = await conversationCollection.deleteOne({ conversationId, userId });

  if (result.deletedCount === 0) {
    throw new NotFoundError('Conversation');
  }

  // Delete associated messages
  await messageCollection.deleteMany({ conversationId });

  logger.info({ conversationId }, 'Conversation deleted');
};

export const addMessage = async (
  messageId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  citations?: Array<{ documentId: string; documentName: string; text: string }>
): Promise<MessageData> => {
  const db = getDatabase();
  const messageCollection = db.collection<MessageData>('messages');
  const conversationCollection = db.collection<ConversationData>('conversations');

  const message: MessageData = {
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
  await conversationCollection.updateOne(
    { conversationId },
    {
      $inc: { messageCount: 1 },
      $set: { updatedAt: new Date() },
    }
  );

  logger.debug({ messageId, conversationId }, 'Message added');

  return message;
};

export const getConversationMessages = async (
  conversationId: string,
  pagination: PaginationInput
): Promise<{ messages: MessageData[]; total: number }> => {
  const db = getDatabase();
  const collection = db.collection<MessageData>('messages');

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

export const getRecentConversationHistory = async (
  conversationId: string,
  limit: number = 10
): Promise<MessageData[]> => {
  const db = getDatabase();
  const collection = db.collection<MessageData>('messages');

  return collection
    .find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
    .then((msgs) => msgs.reverse()); // Return in chronological order
};
