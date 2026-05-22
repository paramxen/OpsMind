import { UserPayload } from '../../types/index.js';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare const generateAccessToken: (user: Omit<UserPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const generateTokenPair: (user: Omit<UserPayload, "iat" | "exp">) => TokenPair;
export declare const verifyAccessToken: (token: string) => UserPayload;
export declare const verifyRefreshToken: (token: string) => {
    userId: string;
};
export declare const decodeToken: (token: string) => unknown;
//# sourceMappingURL=token.service.d.ts.map