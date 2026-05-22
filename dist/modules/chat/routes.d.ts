import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/index.js';
declare const router: import("express-serve-static-core").Router;
export declare const createConv: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getConversations: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const sendMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteConv: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export default router;
//# sourceMappingURL=routes.d.ts.map