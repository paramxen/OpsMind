import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { NotFoundError, ConflictError } from '../../core/errors/index.js';
import { hashPassword, comparePassword } from '../../core/security/index.js';
import { UserPayload } from '../../types/index.js';

const logger = getLogger();
const COLLECTION_NAME = 'users';

export interface UserDocument {
  _id?: string;
  userId: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const createUser = async (
  userId: string,
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<UserDocument> => {
  const db = getDatabase();
  const collection = db.collection<UserDocument>(COLLECTION_NAME);

  // Check if user already exists
  const existing = await collection.findOne({ email });
  if (existing) {
    throw new ConflictError('User with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user: UserDocument = {
    userId,
    email,
    passwordHash,
    firstName,
    lastName,
    role: 'user',
    status: 'active',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(user);
  logger.info({ userId, email }, 'User created');

  return { ...user, _id: result.insertedId.toString() };
};

export const getUserById = async (userId: string): Promise<UserDocument | null> => {
  const db = getDatabase();
  const collection = db.collection<UserDocument>(COLLECTION_NAME);
  return collection.findOne({ userId });
};

export const getUserByEmail = async (email: string): Promise<UserDocument | null> => {
  const db = getDatabase();
  const collection = db.collection<UserDocument>(COLLECTION_NAME);
  return collection.findOne({ email });
};

export const verifyUserPassword = async (
  email: string,
  password: string
): Promise<UserDocument> => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new NotFoundError('User');
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new NotFoundError('User');
  }

  return user;
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const db = getDatabase();
  const collection = db.collection<UserDocument>(COLLECTION_NAME);

  const passwordHash = await hashPassword(newPassword);
  const result = await collection.updateOne(
    { userId },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
      $unset: {
        resetPasswordToken: '',
        resetPasswordTokenExpiry: '',
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError('User');
  }

  logger.info({ userId }, 'User password updated');
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  const db = getDatabase();
  const collection = db.collection<UserDocument>(COLLECTION_NAME);

  await collection.updateOne(
    { userId },
    {
      $set: {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );
};

export const getUserPayload = (user: UserDocument): Omit<UserPayload, 'iat' | 'exp'> => {
  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };
};
