import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../../core/logger/index.js';
import {
  SignUpSchema,
  SignInSchema,
  RefreshTokenSchema,
} from '../../validations/index.js';
import { createUser, verifyUserPassword, getUserPayload, updateUserLastLogin } from '../users/user.service.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from './token.service.js';
import { AuthenticationError } from '../../core/errors/index.js';
import { ApiResponse, AuthRequest } from '../../types/index.js';

const router = Router();
const logger = getLogger();

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = SignUpSchema.parse(req.body);

    const userId = uuidv4();
    const user = await createUser(userId, input.email, input.password, input.firstName, input.lastName);

    const tokens = generateTokenPair(getUserPayload(user));

    logger.info({ userId }, 'User signed up');

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const signin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = SignInSchema.parse(req.body);

    const user = await verifyUserPassword(input.email, input.password);
    await updateUserLastLogin(user.userId);

    const tokens = generateTokenPair(getUserPayload(user));

    logger.info({ userId: user.userId }, 'User signed in');

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = RefreshTokenSchema.parse(req.body);

    const payload = verifyRefreshToken(input.refreshToken);
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: '', // Will be fetched from DB in real scenario
      role: 'user',
    });

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new AuthenticationError('User not authenticated');
    }

    logger.info({ userId: req.user.userId }, 'User logged out');

    const response: ApiResponse = {
      success: true,
      data: { message: 'Logged out successfully' },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Auth routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;
