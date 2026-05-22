export class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            code: this.code,
        };
    }
}
export class ValidationError extends AppError {
    constructor(message, code) {
        super(message, 400, code || 'VALIDATION_ERROR');
    }
}
export class AuthenticationError extends AppError {
    constructor(message = 'Unauthorized', code) {
        super(message, 401, code || 'AUTHENTICATION_ERROR');
    }
}
export class AuthorizationError extends AppError {
    constructor(message = 'Forbidden', code) {
        super(message, 403, code || 'AUTHORIZATION_ERROR');
    }
}
export class NotFoundError extends AppError {
    constructor(resource, code) {
        super(`${resource} not found`, 404, code || 'NOT_FOUND');
    }
}
export class ConflictError extends AppError {
    constructor(message, code) {
        super(message, 409, code || 'CONFLICT');
    }
}
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
        if (retryAfter) {
            this.retryAfter = retryAfter;
        }
    }
}
export class InternalServerError extends AppError {
    constructor(message = 'Internal server error', originalError) {
        super(message, 500, 'INTERNAL_SERVER_ERROR');
        if (originalError) {
            this.originalError = originalError;
        }
    }
}
export class ExternalServiceError extends AppError {
    constructor(service, message, code) {
        super(`${service} error: ${message}`, 502, code || 'EXTERNAL_SERVICE_ERROR');
    }
}
export const isAppError = (error) => {
    return error instanceof AppError;
};
//# sourceMappingURL=index.js.map