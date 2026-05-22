import { z } from 'zod';
export declare const SignUpSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>;
export declare const SignInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const ResetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const ConfirmPasswordResetSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const CreateDocumentSchema: z.ZodObject<{
    filename: z.ZodString;
    contentHash: z.ZodString;
    sourceType: z.ZodEnum<["pdf", "docx", "txt", "markdown"]>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    filename: string;
    contentHash: string;
    sourceType: "pdf" | "docx" | "txt" | "markdown";
    metadata?: Record<string, unknown> | undefined;
}, {
    filename: string;
    contentHash: string;
    sourceType: "pdf" | "docx" | "txt" | "markdown";
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const UpdateDocumentSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    metadata?: Record<string, unknown> | undefined;
    title?: string | undefined;
}, {
    metadata?: Record<string, unknown> | undefined;
    title?: string | undefined;
}>;
export declare const CreateChunkSchema: z.ZodObject<{
    documentId: z.ZodString;
    text: z.ZodString;
    pageNumbers: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    text: string;
    metadata?: Record<string, unknown> | undefined;
    pageNumbers?: number[] | undefined;
}, {
    documentId: string;
    text: string;
    metadata?: Record<string, unknown> | undefined;
    pageNumbers?: number[] | undefined;
}>;
export declare const CreateConversationSchema: z.ZodObject<{
    title: z.ZodString;
    documentIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    documentIds: string[];
}, {
    title: string;
    documentIds: string[];
}>;
export declare const SendMessageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    content: z.ZodString;
    documentIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    content: string;
    documentIds?: string[] | undefined;
}, {
    conversationId: string;
    content: string;
    documentIds?: string[] | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const SearchSchema: z.ZodObject<{
    q: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    q: string;
}, {
    q: string;
    limit?: number | undefined;
}>;
export declare const VectorSearchSchema: z.ZodObject<{
    query: z.ZodString;
    documentIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    limit: z.ZodDefault<z.ZodNumber>;
    threshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    threshold: number;
    documentIds?: string[] | undefined;
}, {
    query: string;
    limit?: number | undefined;
    documentIds?: string[] | undefined;
    threshold?: number | undefined;
}>;
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
//# sourceMappingURL=index.d.ts.map