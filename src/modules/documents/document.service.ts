import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { NotFoundError, ConflictError } from '../../core/errors/index.js';
import { DocumentData, DocumentMetadata, PaginationInput, SortOrder } from '../../types/index.js';

const logger = getLogger();
const COLLECTION_NAME = 'documents';

export const createDocument = async (
  documentId: string,
  userId: string,
  filename: string,
  contentHash: string,
  sourceType: 'pdf' | 'docx' | 'txt' | 'markdown',
  metadata?: DocumentMetadata
): Promise<DocumentData> => {
  const db = getDatabase();
  const collection = db.collection<DocumentData>(COLLECTION_NAME);

  // Check for duplicate by hash
  const existing = await collection.findOne({ contentHash });
  if (existing) {
    throw new ConflictError('Document with same content already exists');
  }

  const doc: DocumentData = {
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

export const getDocumentById = async (documentId: string): Promise<DocumentData | null> => {
  const db = getDatabase();
  const collection = db.collection<DocumentData>(COLLECTION_NAME);
  return collection.findOne({ documentId });
};

export const getDocumentsByUserId = async (
  userId: string,
  pagination: PaginationInput,
  sortBy: 'createdAt' | 'updatedAt' = 'createdAt',
  order: SortOrder = -1
): Promise<{ documents: DocumentData[]; total: number }> => {
  const db = getDatabase();
  const collection = db.collection<DocumentData>(COLLECTION_NAME);

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

export const updateDocumentStatus = async (
  documentId: string,
  status: DocumentData['status'],
  updates?: Partial<DocumentData>
): Promise<void> => {
  const db = getDatabase();
  const collection = db.collection<DocumentData>(COLLECTION_NAME);

  const result = await collection.updateOne(
    { documentId },
    {
      $set: {
        status,
        ...updates,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError('Document');
  }

  logger.info({ documentId, status }, 'Document status updated');
};

export const updateDocumentMetadata = async (
  documentId: string,
  metadata: DocumentMetadata
): Promise<void> => {
  const db = getDatabase();
  const collection = db.collection<DocumentData>(COLLECTION_NAME);

  const result = await collection.updateOne(
    { documentId },
    {
      $set: {
        metadata,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError('Document');
  }
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  const db = getDatabase();
  const collection = db.collection<DocumentData>(COLLECTION_NAME);

  const result = await collection.deleteOne({ documentId });

  if (result.deletedCount === 0) {
    throw new NotFoundError('Document');
  }

  logger.info({ documentId }, 'Document deleted');
};

export const findDocumentByHash = async (contentHash: string): Promise<DocumentData | null> => {
  const db = getDatabase();
  const collection = db.collection<DocumentData>(COLLECTION_NAME);
  return collection.findOne({ contentHash });
};
