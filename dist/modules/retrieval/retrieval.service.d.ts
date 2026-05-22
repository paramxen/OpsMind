import { RetrievalResult } from '../../types/index.js';
export declare const vectorSearch: (queryText: string, documentIds?: string[], limit?: number, threshold?: number) => Promise<RetrievalResult[]>;
export declare const getRelevantContext: (queryText: string, documentIds: string[], contextLimit?: number, maxChunks?: number) => Promise<{
    context: string;
    results: RetrievalResult[];
}>;
export declare const hybridSearch: (queryText: string, documentIds?: string[], limit?: number) => Promise<RetrievalResult[]>;
//# sourceMappingURL=retrieval.service.d.ts.map