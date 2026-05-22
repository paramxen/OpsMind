import { UserPayload } from '../../types/index.js';
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
export declare const createUser: (userId: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<UserDocument>;
export declare const getUserById: (userId: string) => Promise<UserDocument | null>;
export declare const getUserByEmail: (email: string) => Promise<UserDocument | null>;
export declare const verifyUserPassword: (email: string, password: string) => Promise<UserDocument>;
export declare const updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
export declare const updateUserLastLogin: (userId: string) => Promise<void>;
export declare const getUserPayload: (user: UserDocument) => Omit<UserPayload, "iat" | "exp">;
//# sourceMappingURL=user.service.d.ts.map