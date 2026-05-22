export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
    toJSON(): {
        name: string;
        message: string;
        statusCode: number;
        code: string | undefined;
    };
}
export declare class ValidationError extends AppError {
    constructor(message: string, code?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, code?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, retryAfter?: number);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string, originalError?: Error);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string, code?: string);
}
export declare const isAppError: (error: unknown) => error is AppError;
//# sourceMappingURL=index.d.ts.map