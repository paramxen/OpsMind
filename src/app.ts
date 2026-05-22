import express from 'express';
import pinoHttp from 'pino-http';
import { getConfig } from './core/config/index.js';
import { getLogger } from './core/logger/index.js';
import {
  errorHandler,
  securityHeaders,
  corsMiddleware,
  createRateLimiter,
  requestLogger,
} from './core/middleware/index.js';
import authRoutes from './modules/auth/routes.js';
import ingestionRoutes from './modules/ingestion/routes.js';
import chatRoutes from './modules/chat/routes.js';

const app = express();
const logger = getLogger();
const config = getConfig();

// Security middleware
app.use(securityHeaders);
app.use(corsMiddleware);

// Logging middleware
app.use(pinoHttp({ logger } as any));
app.use(requestLogger);

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Rate limiting
app.use('/api/', createRateLimiter());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', ingestionRoutes);
app.use('/api/v1/chat', chatRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Not found',
      code: 'NOT_FOUND',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
