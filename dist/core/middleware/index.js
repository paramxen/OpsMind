import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getConfig } from '../config/index.js';
import { getLogger } from '../logger/index.js';
import { isAppError } from '../errors/index.js';
const logger = getLogger();
const config = getConfig();
// Error handling middleware
export const errorHandler = (err, _req, res, _next) => {
    if (res.headersSent) {
        return;
    }
    if (isAppError(err)) {
        logger.warn({ error: err.toJSON(), path: _req.path }, `Application error: ${err.message}`);
        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                code: err.code,
            },
        });
        return;
    }
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error({ error: error.message, stack: error.stack, path: _req.path }, 'Unhandled error');
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
        },
    });
};
// Helmet security headers
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});
// CORS configuration
export const corsMiddleware = cors({
    origin: config.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
});
// Rate limiting
export const createRateLimiter = (windowMs, max) => {
    return rateLimit({
        windowMs: windowMs ?? config.RATE_LIMIT_WINDOW_MS,
        max: max ?? config.RATE_LIMIT_MAX_REQUESTS,
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => config.NODE_ENV === 'test',
    });
};
// Request logging middleware
export const requestLogger = (req, _res, next) => {
    logger.debug({
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
    }, 'Incoming request');
    next();
};
// JSON body size limit middleware
export const jsonParser = (req, _res, next) => {
    // This is handled by express middleware in app setup
    next();
};
//# sourceMappingURL=index.js.map