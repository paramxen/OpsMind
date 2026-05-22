import { z } from 'zod';

// Auth schemas
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ConfirmPasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Document schemas
export const CreateDocumentSchema = z.object({
  filename: z.string().min(1),
  contentHash: z.string().min(1),
  sourceType: z.enum(['pdf', 'docx', 'txt', 'markdown']),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Chunk schemas
export const CreateChunkSchema = z.object({
  documentId: z.string().min(1),
  text: z.string().min(1),
  pageNumbers: z.array(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Chat schemas
export const CreateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  documentIds: z.array(z.string().min(1)).min(1, 'At least one document is required'),
});

export const SendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required').max(10000),
  documentIds: z.array(z.string().min(1)).optional(),
});

// Query schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const VectorSearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  documentIds: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.5),
});

// Type exports
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof ConfirmPasswordResetSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type CreateChunkInput = z.infer<typeof CreateChunkSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type VectorSearchInput = z.infer<typeof VectorSearchSchema>;
