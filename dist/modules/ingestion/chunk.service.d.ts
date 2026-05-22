import { ChunkData } from '../../types/index.js';
export declare const createChunk: (chunk: ChunkData) => Promise<ChunkData>;
export declare const createChunks: (chunks: ChunkData[]) => Promise<string[]>;
export declare const getChunkById: (chunkId: string) => Promise<ChunkData | null>;
export declare const getChunksByDocumentId: (documentId: string, limit?: number) => Promise<ChunkData[]>;
export declare const deleteChunksByDocumentId: (documentId: string) => Promise<number>;
export declare const splitTextIntoChunks: (text: string, documentId: string, sourceFilename: string) => ChunkData[];
export declare const estimateChunkCount: (textLength: number) => number;
//# sourceMappingURL=chunk.service.d.ts.map