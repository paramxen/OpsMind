import { getDatabase } from '../../core/database/index.js';
import { getLogger } from '../../core/logger/index.js';
import { NotFoundError, ConflictError } from '../../core/errors/index.js';
import { hashPassword, comparePassword } from '../../core/security/index.js';
const logger = getLogger();
const COLLECTION_NAME = 'users';
export const createUser = async (userId, email, password, firstName, lastName) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    // Check if user already exists
    const existing = await collection.findOne({ email });
    if (existing) {
        throw new ConflictError('User with this email already exists');
    }
    const passwordHash = await hashPassword(password);
    const user = {
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
export const getUserById = async (userId) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    return collection.findOne({ userId });
};
export const getUserByEmail = async (email) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    return collection.findOne({ email });
};
export const verifyUserPassword = async (email, password) => {
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
export const updateUserPassword = async (userId, newPassword) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const passwordHash = await hashPassword(newPassword);
    const result = await collection.updateOne({ userId }, {
        $set: {
            passwordHash,
            updatedAt: new Date(),
        },
        $unset: {
            resetPasswordToken: '',
            resetPasswordTokenExpiry: '',
        },
    });
    if (result.matchedCount === 0) {
        throw new NotFoundError('User');
    }
    logger.info({ userId }, 'User password updated');
};
export const updateUserLastLogin = async (userId) => {
    const db = getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    await collection.updateOne({ userId }, {
        $set: {
            lastLoginAt: new Date(),
            updatedAt: new Date(),
        },
    });
};
export const getUserPayload = (user) => {
    return {
        userId: user.userId,
        email: user.email,
        role: user.role,
    };
};
//# sourceMappingURL=user.service.js.map