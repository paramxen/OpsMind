import { ChunkData } from '../../types/index.js';
export interface EmbeddingResult {
    text: string;
    embedding: number[];
}
export declare const embedChunks: (chunks: ChunkData[]) => Promise<number[][]>;
export declare const embedText: (text: string) => Promise<number[]>;
export declare const embedMultipleTexts: (texts: string[]) => Promise<number[][]>;
//# sourceMappingURL=embedding.service.d.ts.map