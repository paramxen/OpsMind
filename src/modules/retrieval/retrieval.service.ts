import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { RetrievalResult, ChunkData } from '../../types/index.js';
import { embedText } from '../embeddings/embedding.service.js';

const logger = getLogger();
const CHUNK_COLLECTION = 'chunks';

export const vectorSearch = async (
  queryText: string,
  documentIds?: string[],
  limit: number = 10,
  threshold: number = 0.5
): Promise<RetrievalResult[]> => {
  try {
    const db = getDatabase();
    const collection = db.collection<ChunkData>(CHUNK_COLLECTION);

    // Embed the query
    const queryEmbedding = await embedText(queryText);

    // Build the vector search pipeline
    const pipeline: any[] = [
      {
        $search: {
          cosmosSearch: {
            vector: queryEmbedding,
            k: limit * 2, // Get more than needed for filtering
          },
          returnScore: true,
          returnScoreDetails: true,
        },
      },
      {
        $project: {
          similarity: { $meta: 'searchScore' },
          document: '$$ROOT',
        },
      },
    ];

    // Add document filter if specified
    if (documentIds && documentIds.length > 0) {
      pipeline.push({
        $match: {
          'document.documentId': { $in: documentIds },
        },
      });
    }

    // Filter by threshold and limit
    pipeline.push(
      {
        $match: {
          similarity: { $gte: threshold },
        },
      },
      {
        $limit: limit,
      },
      {
        $sort: {
          similarity: -1,
        },
      }
    );

    const results = await collection.aggregate(pipeline).toArray();

    logger.debug(
      { query: queryText, resultCount: results.length, threshold },
      'Vector search completed'
    );

    return results.map((result: any) => ({
      chunkId: result.document._id?.toString() || '',
      documentId: result.document.documentId,
      documentName: result.document.sourceFilename,
      text: result.document.text,
      relevanceScore: result.similarity,
      pageNumber: result.document.pageNumbers?.[0],
    }));
  } catch (error) {
    logger.error({ err: error, query: queryText }, 'Vector search failed');
    throw error;
  }
};

export const getRelevantContext = async (
  queryText: string,
  documentIds: string[],
  contextLimit: number = 3000,
  maxChunks: number = 5
): Promise<{ context: string; results: RetrievalResult[] }> => {
  const results = await vectorSearch(queryText, documentIds, maxChunks, 0.3);

  let context = '';
  let charCount = 0;

  for (const result of results) {
    const chunk = `\n[${result.documentName}] ${result.text}\n`;
    if (charCount + chunk.length <= contextLimit) {
      context += chunk;
      charCount += chunk.length;
    } else {
      break;
    }
  }

  logger.debug(
    { charCount: context.length, chunkCount: results.length },
    'Generated retrieval context'
  );

  return {
    context,
    results,
  };
};

export const hybridSearch = async (
  queryText: string,
  documentIds?: string[],
  limit: number = 10
): Promise<RetrievalResult[]> => {
  // Hybrid search: combine vector search with keyword matching
  const vectorResults = await vectorSearch(queryText, documentIds, limit, 0.4);

  // In a production system, you'd also do keyword search here
  // and merge/rank results

  return vectorResults;
};
