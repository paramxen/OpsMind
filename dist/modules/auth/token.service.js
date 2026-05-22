import jwt from 'jsonwebtoken';
import { getConfig } from '../../core/config/index.js';
import { getLogger } from '../../core/logger/index.js';
import { AuthenticationError } from '../../core/errors/index.js';
const logger = getLogger();
const config = getConfig();
export const generateAccessToken = (user) => {
    try {
        return jwt.sign(user, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRY,
            issuer: 'opsmind',
            subject: user.userId,
        });
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to generate access token');
        throw new AuthenticationError('Failed to generate token');
    }
};
export const generateRefreshToken = (userId) => {
    try {
        return jwt.sign({ userId }, config.JWT_SECRET, {
            expiresIn: config.REFRESH_TOKEN_EXPIRY,
            issuer: 'opsmind',
            subject: userId,
        });
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to generate refresh token');
        throw new AuthenticationError('Failed to generate refresh token');
    }
};
export const generateTokenPair = (user) => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user.userId),
    };
};
export const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET, {
            issuer: 'opsmind',
        });
        return decoded;
    }
    catch (error) {
        logger.warn({ err: error }, 'Invalid access token');
        throw new AuthenticationError('Invalid token');
    }
};
export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET, {
            issuer: 'opsmind',
        });
        return decoded;
    }
    catch (error) {
        logger.warn({ err: error }, 'Invalid refresh token');
        throw new AuthenticationError('Invalid refresh token');
    }
};
export const decodeToken = (token) => {
    return jwt.decode(token);
};
//# sourceMappingURL=token.service.js.map