import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/index.js';
export declare const authMiddleware: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const adminMiddleware: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const requireAuth: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const requireAdmin: ((req: AuthRequest, _res: Response, next: NextFunction) => void)[];
//# sourceMappingURL=middleware.d.ts.map