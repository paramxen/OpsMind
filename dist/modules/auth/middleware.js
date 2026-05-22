import { getLogger } from '../../core/logger/index.js';
import { AuthenticationError, AuthorizationError } from '../../core/errors/index.js';
import { verifyAccessToken } from './token.service.js';
const logger = getLogger();
export const authMiddleware = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('Missing or invalid authorization header');
        }
        const token = authHeader.substring(7);
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        logger.warn({ err: error }, 'Authentication failed');
        next(error);
    }
};
export const adminMiddleware = (req, _res, next) => {
    if (!req.user) {
        throw new AuthenticationError('Not authenticated');
    }
    if (req.user.role !== 'admin') {
        throw new AuthorizationError('Admin access required');
    }
    next();
};
export const requireAuth = authMiddleware;
export const requireAdmin = [authMiddleware, adminMiddleware];
//# sourceMappingURL=middleware.js.map