import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/index.js';
declare const router: import("express-serve-static-core").Router;
export declare const signup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const signin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const logout: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export default router;
//# sourceMappingURL=routes.d.ts.map