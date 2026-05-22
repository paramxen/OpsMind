import OpenAI from 'openai';
import { getConfig } from '../../core/config/index.js';
import { getLogger } from '../../core/logger/index.js';
import { ExternalServiceError } from '../../core/errors/index.js';
import { delay, retry, chunk } from '../../core/utils/index.js';
import { ChunkData } from '../../types/index.js';

const logger = getLogger();
const config = getConfig();

const client = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_API_BASE,
});

export interface EmbeddingResult {
  text: string;
  embedding: number[];
}

export const embedChunks = async (chunks: ChunkData[]): Promise<number[][]> => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return [];
  }

  const batchSize = Math.max(1, config.EMBEDDING_BATCH_SIZE);
  const embeddingResults: number[][] = [];
  const totalBatches = Math.ceil(chunks.length / batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const offset = batchIndex * batchSize;
    const batch = chunks.slice(offset, offset + batchSize);
    const inputs = batch.map((c) => c.text);

    logger.debug(
      { batchIndex: batchIndex + 1, totalBatches, batchSize: batch.length },
      'Processing embedding batch'
    );

    try {
      const response = await retry(
        () =>
          client.embeddings.create({
            model: config.OPENAI_EMBEDDING_MODEL,
            input: inputs,
          }),
        { attempts: 3, backoff: 1000 }
      );

      if (!response || !response.data) {
        throw new Error('OpenAI embeddings response was malformed');
      }

      response.data.forEach((item) => {
        if (!item.embedding || !Array.isArray(item.embedding)) {
          throw new Error('Invalid embedding vector received from OpenAI');
        }
        embeddingResults.push(item.embedding);
      });
    } catch (error) {
      logger.error({ err: error, batchIndex }, 'Failed to generate embeddings for batch');
      throw new ExternalServiceError(
        'OpenAI',
        (error as Error).message,
        'EMBEDDING_GENERATION_FAILED'
      );
    }
  }

  const expectedDim = embeddingResults[0]?.length || 0;
  if (expectedDim === 0) {
    throw new Error('Embedding dimension could not be determined');
  }

  const inconsistent = embeddingResults.some((vector) => vector.length !== expectedDim);
  if (inconsistent) {
    throw new Error('Embedding dimension mismatch detected across chunks');
  }

  logger.info(
    { totalChunks: chunks.length, embeddingDimension: expectedDim },
    'Embeddings generated successfully'
  );

  return embeddingResults;
};

export const embedText = async (text: string): Promise<number[]> => {
  try {
    const response = await retry(
      () =>
        client.embeddings.create({
          model: config.OPENAI_EMBEDDING_MODEL,
          input: text,
        }),
      { attempts: 3, backoff: 1000 }
    );

    if (!response || !response.data || response.data.length === 0) {
      throw new Error('Invalid response from embeddings API');
    }

    const embedding = response.data[0].embedding;
    if (!Array.isArray(embedding)) {
      throw new Error('Invalid embedding format');
    }

    return embedding;
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate embedding for text');
    throw new ExternalServiceError(
      'OpenAI',
      (error as Error).message,
      'EMBEDDING_GENERATION_FAILED'
    );
  }
};

export const embedMultipleTexts = async (texts: string[]): Promise<number[][]> => {
  if (texts.length === 0) {
    return [];
  }

  const batchSize = Math.max(1, config.EMBEDDING_BATCH_SIZE);
  const embeddings: number[][] = [];

  const batches = chunk(texts, batchSize);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    logger.debug(
      { batchIndex: i + 1, totalBatches: batches.length, batchSize: batch.length },
      'Processing text embedding batch'
    );

    try {
      const response = await retry(
        () =>
          client.embeddings.create({
            model: config.OPENAI_EMBEDDING_MODEL,
            input: batch,
          }),
        { attempts: 3, backoff: 1000 }
      );

      if (!response || !response.data) {
        throw new Error('Invalid response from embeddings API');
      }

      response.data.forEach((item) => {
        if (!item.embedding || !Array.isArray(item.embedding)) {
          throw new Error('Invalid embedding format');
        }
        embeddings.push(item.embedding);
      });
    } catch (error) {
      logger.error({ err: error, batchIndex: i }, 'Failed to embed text batch');
      throw new ExternalServiceError(
        'OpenAI',
        (error as Error).message,
        'EMBEDDING_GENERATION_FAILED'
      );
    }
  }

  return embeddings;
};
