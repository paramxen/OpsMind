export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateFileHash: (filePath: string) => Promise<string>;
export declare const generateToken: (length?: number) => string;
export declare const hashToken: (token: string) => string;
export declare const sanitizeInput: (input: string) => string;
//# sourceMappingURL=index.d.ts.map