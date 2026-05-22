export declare const extractPdfText: (filePath: string) => Promise<string>;
export declare const extractPdfMetadata: (filePath: string) => Promise<{
    pageCount: number;
    metadata?: Record<string, unknown>;
}>;
//# sourceMappingURL=pdf.service.d.ts.map