import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { NotFoundError } from '../../core/errors/index.js';
import { ChunkData } from '../../types/index.js';

const logger = getLogger();
const COLLECTION_NAME = 'chunks';

const CHUNK_MAX_LENGTH = 1000;
const CHUNK_OVERLAP = 100;
const MIN_CHUNK_LENGTH = 600;

export const createChunk = async (chunk: ChunkData): Promise<ChunkData> => {
  const db = getDatabase();
  const collection = db.collection<ChunkData>(COLLECTION_NAME);

  const result = await collection.insertOne(chunk);
  logger.debug({ chunkId: result.insertedId, documentId: chunk.documentId }, 'Chunk created');

  return { ...chunk, _id: result.insertedId.toString() } as ChunkData & { _id: string };
};

export const createChunks = async (chunks: ChunkData[]): Promise<string[]> => {
  if (chunks.length === 0) {
    return [];
  }

  const db = getDatabase();
  const collection = db.collection<ChunkData>(COLLECTION_NAME);

  const result = await collection.insertMany(chunks);
  logger.info({ count: chunks.length }, 'Chunks created');

  return Object.values(result.insertedIds).map((id) => id.toString());
};

export const getChunkById = async (chunkId: string): Promise<ChunkData | null> => {
  const db = getDatabase();
  const collection = db.collection<ChunkData>(COLLECTION_NAME);
  // Note: Using chunkIndex as a pseudo-ID for now
  return collection.findOne({ _id: { $eq: chunkId as any } });
};

export const getChunksByDocumentId = async (
  documentId: string,
  limit: number = 100
): Promise<ChunkData[]> => {
  const db = getDatabase();
  const collection = db.collection<ChunkData>(COLLECTION_NAME);

  return collection
    .find({ documentId })
    .sort({ chunkIndex: 1 })
    .limit(limit)
    .toArray();
};

export const deleteChunksByDocumentId = async (documentId: string): Promise<number> => {
  const db = getDatabase();
  const collection = db.collection<ChunkData>(COLLECTION_NAME);

  const result = await collection.deleteMany({ documentId });
  logger.info({ documentId, deletedCount: result.deletedCount }, 'Chunks deleted');

  return result.deletedCount;
};

export const splitTextIntoChunks = (
  text: string,
  documentId: string,
  sourceFilename: string
): ChunkData[] => {
  const sentences = splitSentences(text);
  const chunks: ChunkData[] = [];
  let currentSentences: string[] = [];
  let currentLength = 0;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length + 1;

    if (currentLength + sentenceLength > CHUNK_MAX_LENGTH && currentLength >= MIN_CHUNK_LENGTH) {
      const chunkText = currentSentences.join(' ');
      chunks.push({
        documentId,
        chunkIndex,
        text: chunkText.trim(),
        sourceFilename,
        pageNumbers: [],
        embedding: undefined,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      chunkIndex += 1;

      // Calculate overlap
      let overlapSentences: string[] = [];
      let overlapLength = 0;
      for (let i = currentSentences.length - 1; i >= 0; i--) {
        if (overlapLength >= CHUNK_OVERLAP) break;
        const s = currentSentences[i];
        if (overlapLength + s.length + 1 <= CHUNK_OVERLAP) {
          overlapSentences.unshift(s);
          overlapLength += s.length + 1;
        }
      }

      currentSentences = overlapSentences;
      currentLength = overlapLength;
    }

    currentSentences.push(sentence);
    currentLength += sentenceLength;
  }

  if (currentSentences.length > 0) {
    const chunkText = currentSentences.join(' ');
    chunks.push({
      documentId,
      chunkIndex,
      text: chunkText.trim(),
      sourceFilename,
      pageNumbers: [],
      embedding: undefined,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push({
      documentId,
      chunkIndex: 0,
      text: text.trim(),
      sourceFilename,
      pageNumbers: [],
      embedding: undefined,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return chunks;
};

export const estimateChunkCount = (textLength: number): number => {
  return Math.max(1, Math.ceil(textLength / (CHUNK_MAX_LENGTH - CHUNK_OVERLAP)));
};

const splitSentences = (text: string): string[] => {
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+|$)/g;
  const matches = text.match(sentenceRegex);
  return matches ? matches.map((s) => s.trim()).filter((s) => s.length > 0) : [text.trim()];
};
