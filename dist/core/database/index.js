import { MongoClient } from 'mongodb';
import { getConfig } from '../config/index.js';
import { getLogger } from '../logger/index.js';
const logger = getLogger();
let mongoClient = null;
let db = null;
export const connectDatabase = async () => {
    if (db) {
        logger.debug('MongoDB already connected, reusing connection');
        return db;
    }
    try {
        const config = getConfig();
        mongoClient = new MongoClient(config.MONGO_URI, {
            serverApi: { version: '1' },
            maxPoolSize: 20,
            minPoolSize: 5,
        });
        await mongoClient.connect();
        db = mongoClient.db(config.MONGO_DB_NAME);
        logger.info({ dbName: config.MONGO_DB_NAME }, 'Connected to MongoDB Atlas');
        return db;
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to connect to MongoDB');
        throw error;
    }
};
export const getDatabase = () => {
    if (!db) {
        throw new Error('MongoDB client is not initialized. Call connectDatabase first.');
    }
    return db;
};
export const disconnectDatabase = async () => {
    if (mongoClient) {
        await mongoClient.close();
        logger.info('Disconnected from MongoDB');
        mongoClient = null;
        db = null;
    }
};
export const ensureIndexes = async () => {
    const database = getDatabase();
    const collections = {
        users: database.collection('users'),
        documents: database.collection('documents'),
        chunks: database.collection('chunks'),
        conversations: database.collection('conversations'),
        messages: database.collection('messages'),
        ingestionJobs: database.collection('ingestion_jobs'),
        analytics: database.collection('analytics'),
        auditLogs: database.collection('audit_logs'),
    };
    try {
        // Users indexes
        await collections.users.createIndex({ email: 1 }, { unique: true, background: true });
        await collections.users.createIndex({ createdAt: 1 }, { background: true });
        await collections.users.createIndex({ status: 1 }, { background: true });
        // Documents indexes
        await collections.documents.createIndex({ contentHash: 1 }, { unique: true, background: true });
        await collections.documents.createIndex({ userId: 1 }, { background: true });
        await collections.documents.createIndex({ status: 1 }, { background: true });
        await collections.documents.createIndex({ createdAt: -1 }, { background: true });
        // Chunks indexes
        await collections.chunks.createIndex({ documentId: 1 }, { background: true });
        // Vector search index using aggregation
        try {
            const indexes = await collections.chunks.listIndexes().toArray();
            const hasVector = indexes.some(idx => idx.name === 'embedding_vector');
            if (!hasVector) {
                await collections.chunks.createIndex({ embedding: 'cosmosSearch' }, {
                    cosmosSearchOptions: {
                        kind: 'vector-ivf',
                        dimensions: 3072,
                        similarity: 'COS',
                        m: 4,
                    },
                });
            }
        }
        catch (error) {
            logger.warn({ err: error }, 'Failed to create vector index, this is expected on non-Atlas MongoDB');
        }
        // Conversations indexes
        await collections.conversations.createIndex({ userId: 1 }, { background: true });
        await collections.conversations.createIndex({ createdAt: -1 }, { background: true });
        // Messages indexes
        await collections.messages.createIndex({ conversationId: 1 }, { background: true });
        await collections.messages.createIndex({ createdAt: -1 }, { background: true });
        // Ingestion jobs indexes
        await collections.ingestionJobs.createIndex({ status: 1 }, { background: true });
        await collections.ingestionJobs.createIndex({ userId: 1 }, { background: true });
        // Audit logs indexes
        await collections.auditLogs.createIndex({ userId: 1 }, { background: true });
        await collections.auditLogs.createIndex({ createdAt: -1 }, { background: true });
        logger.info('MongoDB indexes ensured successfully');
    }
    catch (error) {
        logger.warn({ err: error }, 'Failed to create some indexes');
    }
};
//# sourceMappingURL=index.js.map