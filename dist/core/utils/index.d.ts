export declare const delay: (ms: number) => Promise<void>;
export declare const retry: <T>(fn: () => Promise<T>, options?: {
    attempts?: number;
    backoff?: number;
}) => Promise<T>;
export declare const formatBytes: (bytes: number) => string;
export declare const generateId: () => string;
export declare const chunk: <T>(arr: T[], size: number) => T[][];
//# sourceMappingURL=index.d.ts.map