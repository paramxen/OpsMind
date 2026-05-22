import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { NotFoundError, ConflictError } from '../../core/errors/index.js';
const logger = getLogger();
const COLLECTION_NAME = 'documents';
export const createDocument = async (documentId, userId, filename, contentHash, sourceType, metadata) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    // Check for duplicate by hash
    const existing = await collection.findOne({ contentHash });
    if (existing) {
        throw new ConflictError('Document with same content already exists');
    }
    const doc = {
        documentId,
        userId,
        filename,
        contentHash,
        sourceType,
        status: 'uploaded',
        metadata,
        uploadedAt: new Date(),
        updatedAt: new Date(),
    };
    await collection.insertOne(doc);
    logger.info({ documentId, userId, filename }, 'Document created');
    return doc;
};
export const getDocumentById = async (documentId) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    return collection.findOne({ documentId });
};
export const getDocumentsByUserId = async (userId, pagination, sortBy = 'createdAt', order = -1) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const skip = (pagination.page - 1) * pagination.limit;
    const [documents, total] = await Promise.all([
        collection
            .find({ userId })
            .sort(sortBy, order)
            .skip(skip)
            .limit(pagination.limit)
            .toArray(),
        collection.countDocuments({ userId }),
    ]);
    return { documents, total };
};
export const updateDocumentStatus = async (documentId, status, updates) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.updateOne({ documentId }, {
        $set: {
            status,
            ...updates,
            updatedAt: new Date(),
        },
    });
    if (result.matchedCount === 0) {
        throw new NotFoundError('Document');
    }
    logger.info({ documentId, status }, 'Document status updated');
};
export const updateDocumentMetadata = async (documentId, metadata) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.updateOne({ documentId }, {
        $set: {
            metadata,
            updatedAt: new Date(),
        },
    });
    if (result.matchedCount === 0) {
        throw new NotFoundError('Document');
    }
};
export const deleteDocument = async (documentId) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.deleteOne({ documentId });
    if (result.deletedCount === 0) {
        throw new NotFoundError('Document');
    }
    logger.info({ documentId }, 'Document deleted');
};
export const findDocumentByHash = async (contentHash) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    return collection.findOne({ contentHash });
};
//# sourceMappingURL=document.service.js.map