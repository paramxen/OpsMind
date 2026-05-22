import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getConfig } from '../../core/config/index.js';
import { getLogger } from '../../core/logger/index.js';
import { UserPayload } from '../../types/index.js';
import { AuthenticationError } from '../../core/errors/index.js';

const logger = getLogger();
const config = getConfig();

const getSecret = (): string | Buffer => {
  const secret = config.JWT_SECRET;
  return Buffer.isBuffer(secret) ? secret : Buffer.from(secret, 'utf-8');
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateAccessToken = (user: Omit<UserPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(user, getSecret(), {
      expiresIn: config.JWT_EXPIRY,
      issuer: 'opsmind',
      subject: user.userId,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate access token');
    throw new AuthenticationError('Failed to generate token');
  }
};

export const generateRefreshToken = (userId: string): string => {
  try {
    return jwt.sign({ userId }, getSecret(), {
      expiresIn: config.REFRESH_TOKEN_EXPIRY,
      issuer: 'opsmind',
      subject: userId,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate refresh token');
    throw new AuthenticationError('Failed to generate refresh token');
  }
};

export const generateTokenPair = (user: Omit<UserPayload, 'iat' | 'exp'>): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.userId),
  };
};

export const verifyAccessToken = (token: string): UserPayload => {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      issuer: 'opsmind',
    });
    return decoded as UserPayload;
  } catch (error) {
    logger.warn({ err: error }, 'Invalid access token');
    throw new AuthenticationError('Invalid token');
  }
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      issuer: 'opsmind',
    });
    return decoded as { userId: string };
  } catch (error) {
    logger.warn({ err: error }, 'Invalid refresh token');
    throw new AuthenticationError('Invalid refresh token');
  }
};

export const decodeToken = (token: string): unknown => {
  return jwt.decode(token);
};
