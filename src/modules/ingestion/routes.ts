import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getConfig } from '../../core/config/index.js';
import { getLogger } from '../../core/logger/index.js';
import { ValidationError } from '../../core/errors/index.js';
import { requireAuth } from '../auth/middleware.js';
import { ingestMultiplePdfs } from './ingestion.service.js';
import { getDocumentsByUserId } from '../documents/document.service.js';
import { getChunksByDocumentId } from './chunk.service.js';
import { AuthRequest, ApiResponse, PaginationInput } from '../../types/index.js';
import { PaginationSchema } from '../../validations/index.js';

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

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
export const uploadDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const filePaths = files.map((f: any) => ({
      path: f.path as string,
      originalname: f.originalname as string,
    }));

    const results = await ingestMultiplePdfs(filePaths, req.user.userId);

    logger.info({ userId: req.user.userId, fileCount: files.length }, 'Documents uploaded');

    const response: ApiResponse = {
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          completed: results.filter((r) => r.status === 'completed').length,
          duplicates: results.filter((r) => r.status === 'duplicate').length,
          failed: results.filter((r) => r.status === 'failed').length,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get user documents
export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new ValidationError('User not authenticated');
    }

    const pagination = PaginationSchema.parse(req.query);
    const { documents, total } = await getDocumentsByUserId(req.user.userId, pagination);

    const response: ApiResponse = {
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
  } catch (error) {
    next(error);
  }
};

// Get document chunks
export const getDocumentChunks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      throw new ValidationError('Document ID is required');
    }

    const chunks = await getChunksByDocumentId(documentId, 100);

    const response: ApiResponse = {
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
  } catch (error) {
    next(error);
  }
};

// Setup routes
router.post('/', requireAuth, upload.array('files', config.UPLOAD_MAX_FILES), uploadDocuments);
router.get('/', requireAuth, getDocuments);
router.get('/:documentId/chunks', getDocumentChunks);

export default router;
