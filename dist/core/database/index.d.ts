import { Db } from 'mongodb';
export declare const connectDatabase: () => Promise<Db>;
export declare const getDatabase: () => Db;
export declare const disconnectDatabase: () => Promise<void>;
export declare const ensureIndexes: () => Promise<void>;
//# sourceMappingURL=index.d.ts.map