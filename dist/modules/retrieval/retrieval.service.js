import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { embedText } from '../embeddings/embedding.service.js';
const logger = getLogger();
const CHUNK_COLLECTION = 'chunks';
export const vectorSearch = async (queryText, documentIds, limit = 10, threshold = 0.5) => {
    try {
        const db = getDatabase();
        const collection = db.collection(CHUNK_COLLECTION);
        // Embed the query
        const queryEmbedding = await embedText(queryText);
        // Build the vector search pipeline
        const pipeline = [
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
        pipeline.push({
            $match: {
                similarity: { $gte: threshold },
            },
        }, {
            $limit: limit,
        }, {
            $sort: {
                similarity: -1,
            },
        });
        const results = await collection.aggregate(pipeline).toArray();
        logger.debug({ query: queryText, resultCount: results.length, threshold }, 'Vector search completed');
        return results.map((result) => ({
            chunkId: result.document._id?.toString() || '',
            documentId: result.document.documentId,
            documentName: result.document.sourceFilename,
            text: result.document.text,
            relevanceScore: result.similarity,
            pageNumber: result.document.pageNumbers?.[0],
        }));
    }
    catch (error) {
        logger.error({ err: error, query: queryText }, 'Vector search failed');
        throw error;
    }
};
export const getRelevantContext = async (queryText, documentIds, contextLimit = 3000, maxChunks = 5) => {
    const results = await vectorSearch(queryText, documentIds, maxChunks, 0.3);
    let context = '';
    let charCount = 0;
    for (const result of results) {
        const chunk = `\n[${result.documentName}] ${result.text}\n`;
        if (charCount + chunk.length <= contextLimit) {
            context += chunk;
            charCount += chunk.length;
        }
        else {
            break;
        }
    }
    logger.debug({ charCount: context.length, chunkCount: results.length }, 'Generated retrieval context');
    return {
        context,
        results,
    };
};
export const hybridSearch = async (queryText, documentIds, limit = 10) => {
    // Hybrid search: combine vector search with keyword matching
    const vectorResults = await vectorSearch(queryText, documentIds, limit, 0.4);
    // In a production system, you'd also do keyword search here
    // and merge/rank results
    return vectorResults;
};
//# sourceMappingURL=retrieval.service.js.map