import { Request } from 'express';

export interface UserPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | {
    message: string;
    code?: string;
  };
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdDate?: Date;
  pageCount?: number;
  size?: number;
  source?: string;
}

export interface ChunkData {
  documentId: string;
  chunkIndex: number;
  text: string;
  sourceFilename: string;
  pageNumbers?: number[];
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentData {
  _id?: string;
  documentId: string;
  userId: string;
  filename: string;
  contentHash: string;
  sourceType: 'pdf' | 'docx' | 'txt' | 'markdown';
  sourcePath?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  chunkCount?: number;
  errorMessage?: string;
  metadata?: DocumentMetadata;
  uploadedAt: Date;
  processedAt?: Date;
  updatedAt: Date;
}

export interface ConversationData {
  conversationId: string;
  userId: string;
  title: string;
  documentIds: string[];
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageData {
  messageId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Citation {
  documentId: string;
  documentName: string;
  chunkId: string;
  pageNumber?: number;
  relevanceScore: number;
  text: string;
}

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  text: string;
  relevanceScore: number;
  pageNumber?: number;
}

export interface EmbeddingBatch {
  texts: string[];
  embeddings: number[][];
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export type SortOrder = 1 | -1;
