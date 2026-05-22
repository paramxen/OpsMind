import fs from 'fs/promises';
import { getLogger } from '../../core/logger/index.js';
import { AppError } from '../../core/errors/index.js';
import { generateFileHash } from '../../core/security/index.js';
import { extractPdfText, extractPdfMetadata } from './pdf.service.js';
import { splitTextIntoChunks, createChunks } from './chunk.service.js';
import { embedChunks } from '../embeddings/embedding.service.js';
import { createDocument, updateDocumentStatus, findDocumentByHash, } from '../documents/document.service.js';
const logger = getLogger();
const removeFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
        logger.debug({ filePath }, 'Removed temporary upload file');
    }
    catch (error) {
        logger.warn({ err: error, filePath }, 'Failed to remove uploaded file');
    }
};
export const ingestPdf = async (filePath, filename, userId) => {
    try {
        // Compute file hash for deduplication
        const contentHash = await generateFileHash(filePath);
        const existing = await findDocumentByHash(contentHash);
        if (existing) {
            logger.info({ filename, existingDocumentId: existing.documentId }, 'Duplicate document');
            await removeFile(filePath);
            return {
                filename,
                status: 'duplicate',
                documentId: existing.documentId,
                message: 'Document has already been ingested',
            };
        }
        // Create document record
        const documentId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await createDocument(documentId, userId, filename, contentHash, 'pdf');
        await updateDocumentStatus(documentId, 'processing');
        // Extract PDF text and metadata
        const extractedText = await extractPdfText(filePath);
        if (!extractedText || extractedText.trim().length === 0) {
            throw new AppError('No extractable text found in PDF. The file may be a scanned document that requires OCR.', 422);
        }
        const metadata = await extractPdfMetadata(filePath);
        await updateDocumentStatus(documentId, 'processing', { metadata });
        // Split text into chunks
        const chunks = splitTextIntoChunks(extractedText, documentId, filename);
        logger.info({ documentId, filename, chunkCount: chunks.length }, 'Generated text chunks');
        // Generate embeddings
        logger.info({ chunkCount: chunks.length }, 'Starting embedding generation');
        const embeddings = await embedChunks(chunks);
        // Add embeddings to chunks
        const chunksWithEmbeddings = chunks.map((chunk, index) => ({
            ...chunk,
            embedding: embeddings[index],
        }));
        // Persist chunks
        await createChunks(chunksWithEmbeddings);
        // Mark document as completed
        await updateDocumentStatus(documentId, 'completed', {
            chunkCount: chunksWithEmbeddings.length,
            processedAt: new Date(),
        });
        logger.info({ documentId, filename, chunkCount: chunksWithEmbeddings.length }, 'Document ingestion completed');
        return {
            filename,
            status: 'completed',
            documentId,
            chunkCount: chunksWithEmbeddings.length,
        };
    }
    catch (error) {
        logger.error({ err: error, filename }, 'Document ingestion failed');
        // Mark document as failed if it was created
        try {
            // Try to get document ID and mark as failed
            // This would require storing the documentId in the error or fetching by hash
        }
        catch (failureError) {
            logger.warn({ err: failureError }, 'Failed to mark document as failed');
        }
        await removeFile(filePath);
        return {
            filename,
            status: 'failed',
            error: error.message,
        };
    }
};
export const ingestMultiplePdfs = async (files, userId) => {
    const results = await Promise.allSettled(files.map((file) => ingestPdf(file.path, file.originalname, userId)));
    return results.map((result) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return {
            filename: 'unknown',
            status: 'failed',
            error: result.reason.message,
        };
    });
};
//# sourceMappingURL=ingestion.service.js.map