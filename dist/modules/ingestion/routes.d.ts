import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/index.js';
declare const router: import("express-serve-static-core").Router;
export declare const uploadDocuments: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDocuments: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDocumentChunks: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export default router;
//# sourceMappingURL=routes.d.ts.map