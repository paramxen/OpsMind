import { Router } from 'express';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { getConfig } from '../../core/config/index.js';
import { getLogger } from '../../core/logger/index.js';
import { ValidationError } from '../../core/errors/index.js';
import { requireAuth } from '../auth/middleware.js';
import { getDocumentsByUserId, createDocument } from '../documents/document.service.js';
import { getChunksByDocumentId } from './chunk.service.js';
import { PaginationSchema } from '../../validations/index.js';
import { addIngestionJob, getJobStatus } from '../../jobs/ingestion.job.js';
import { generateFileHash } from '../../core/security/index.js';
const router = Router();
const logger = getLogger();
const config = getConfig();
// Multer configuration
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}-${safeName}`);
    },
});
const fileFilter = (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
        return cb(new ValidationError('Only PDF files are supported'));
    }
    cb(null, true);
};
const upload = multer({
    storage,
    limits: { fileSize: config.MAX_FILE_SIZE_BYTES },
    fileFilter,
});
// Upload documents
export const uploadDocuments = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new ValidationError('User not authenticated');
        }
        if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
            throw new ValidationError('No PDF files provided');
        }
        const files = Array.isArray(req.files) ? req.files : [req.files];
        if (files.length > config.UPLOAD_MAX_FILES) {
            throw new ValidationError(`Maximum ${config.UPLOAD_MAX_FILES} files allowed`);
        }
        const results = [];
        for (const file of files) {
            try {
                const filePath = file.path;
                const originalname = file.originalname;
                // Create document entry
                const fileHash = await generateFileHash(filePath);
                const documentId = new ObjectId().toString();
                const document = await createDocument(documentId, req.user.userId, originalname, fileHash, 'pdf');
                // Queue ingestion job
                await addIngestionJob({
                    documentId,
                    filePath,
                    userId: req.user.userId,
                    fileName: originalname,
                });
                results.push({
                    documentId,
                    fileName: originalname,
                    status: 'queued',
                    message: 'Document queued for ingestion',
                });
                logger.info({ userId: req.user.userId, documentId }, 'Document queued for ingestion');
            }
            catch (error) {
                results.push({
                    fileName: file.originalname,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        logger.info({ userId: req.user.userId, fileCount: files.length }, 'Documents upload queued');
        const response = {
            success: true,
            data: {
                results,
                summary: {
                    total: results.length,
                    queued: results.filter((r) => r.status === 'queued').length,
                    failed: results.filter((r) => r.status === 'failed').length,
                },
            },
        };
        res.status(202).json(response); // 202 Accepted
    }
    catch (error) {
        next(error);
    }
};
// Get user documents
export const getDocuments = async (req, res, next) => {
    try {
        if (!req.user?.userId) {
            throw new ValidationError('User not authenticated');
        }
        const pagination = PaginationSchema.parse(req.query);
        const { documents, total } = await getDocumentsByUserId(req.user.userId, pagination);
        const response = {
            success: true,
            data: {
                documents,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    pages: Math.ceil(total / pagination.limit),
                },
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Get document chunks
export const getDocumentChunks = async (req, res, next) => {
    try {
        const documentId = Array.isArray(req.params.documentId)
            ? req.params.documentId[0]
            : (req.params.documentId || '');
        if (!documentId) {
            throw new ValidationError('Document ID is required');
        }
        const chunks = await getChunksByDocumentId(documentId, 100);
        const response = {
            success: true,
            data: {
                documentId,
                chunkCount: chunks.length,
                chunks: chunks.map((c) => ({
                    chunkIndex: c.chunkIndex,
                    text: c.text,
                    pageNumbers: c.pageNumbers,
                })),
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Get job status
export const getIngestionJobStatus = async (req, res, next) => {
    try {
        const jobId = Array.isArray(req.params.jobId)
            ? req.params.jobId[0]
            : (req.params.jobId || '');
        if (!jobId) {
            throw new ValidationError('Job ID is required');
        }
        const status = await getJobStatus(jobId);
        if (!status) {
            const response = {
                success: false,
                error: 'Job not found',
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: status,
        };
        res.status(200).json(response);
    }
    catch (error) {
        next(error);
    }
};
// Setup routes
router.post('/', requireAuth, upload.array('files', config.UPLOAD_MAX_FILES), uploadDocuments);
router.get('/', requireAuth, getDocuments);
router.get('/jobs/:jobId', getIngestionJobStatus);
router.get('/:documentId/chunks', getDocumentChunks);
export default router;
//# sourceMappingURL=routes.js.map