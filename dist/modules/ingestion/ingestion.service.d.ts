export interface IngestionResult {
    filename: string;
    status: 'completed' | 'duplicate' | 'failed';
    documentId?: string;
    chunkCount?: number;
    message?: string;
    error?: string;
}
export declare const ingestPdf: (filePath: string, filename: string, userId: string) => Promise<IngestionResult>;
export declare const ingestMultiplePdfs: (files: Array<{
    path: string;
    originalname: string;
}>, userId: string) => Promise<IngestionResult[]>;
//# sourceMappingURL=ingestion.service.d.ts.map