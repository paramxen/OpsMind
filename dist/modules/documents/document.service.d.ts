import { DocumentData, DocumentMetadata, PaginationInput, SortOrder } from '../../types/index.js';
export declare const createDocument: (documentId: string, userId: string, filename: string, contentHash: string, sourceType: "pdf" | "docx" | "txt" | "markdown", metadata?: DocumentMetadata) => Promise<DocumentData>;
export declare const getDocumentById: (documentId: string) => Promise<DocumentData | null>;
export declare const getDocumentsByUserId: (userId: string, pagination: PaginationInput, sortBy?: "createdAt" | "updatedAt", order?: SortOrder) => Promise<{
    documents: DocumentData[];
    total: number;
}>;
export declare const updateDocumentStatus: (documentId: string, status: DocumentData["status"], updates?: Partial<DocumentData>) => Promise<void>;
export declare const updateDocumentMetadata: (documentId: string, metadata: DocumentMetadata) => Promise<void>;
export declare const deleteDocument: (documentId: string) => Promise<void>;
export declare const findDocumentByHash: (contentHash: string) => Promise<DocumentData | null>;
//# sourceMappingURL=document.service.d.ts.map