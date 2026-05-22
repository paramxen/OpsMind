import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
export declare const errorHandler: (err: unknown, _req: Request, res: Response, _next: NextFunction) => void;
export declare const securityHeaders: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare const createRateLimiter: (windowMs?: number, max?: number) => import("express-rate-limit").RateLimitRequestHandler;
export declare const requestLogger: (req: Request, _res: Response, next: NextFunction) => void;
export declare const jsonParser: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=index.d.ts.map