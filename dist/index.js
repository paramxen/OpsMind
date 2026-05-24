import fs from 'fs/promises';
import http from 'http';
import app from './app.js';
import { getConfig } from './core/config/index.js';
import { connectDatabase, ensureIndexes, disconnectDatabase } from './core/database/index.js';
import { getLogger } from './core/logger/index.js';
import { ingestionWorker, ingestionQueue, cleanupJobs } from './jobs/ingestion.job.js';
import { initializeWebSocket } from './websocket/index.js';
const logger = getLogger();
const config = getConfig();
const startServer = async () => {
    try {
        // Create upload directory
        await fs.mkdir(config.UPLOAD_DIR, { recursive: true });
        logger.info({ uploadDir: config.UPLOAD_DIR }, 'Upload directory ready');
        // Connect to database
        await connectDatabase();
        await ensureIndexes();
        logger.info('Database connected and indexes ensured');
        // Initialize job worker
        logger.info('Initializing BullMQ worker for ingestion jobs');
        // Start job cleanup interval
        const cleanupInterval = setInterval(() => {
            cleanupJobs().catch(err => logger.error({ err }, 'Cleanup failed'));
        }, 3600000); // Run every hour
        // Create HTTP server
        const httpServer = http.createServer(app);
        // Initialize WebSocket
        initializeWebSocket(httpServer, config.CORS_ORIGIN);
        // Start server
        const server = httpServer.listen(config.PORT, () => {
            logger.info({
                port: config.PORT,
                environment: config.NODE_ENV,
                timestamp: new Date().toISOString(),
            }, 'OpsMind AI server started with WebSocket support');
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info({ signal }, 'Shutdown signal received');
            clearInterval(cleanupInterval);
            server.close(async () => {
                try {
                    // Close worker
                    await ingestionWorker.close();
                    await ingestionQueue.close();
                    logger.info('Job queue and worker closed');
                    await disconnectDatabase();
                    logger.info('Server shut down gracefully');
                    process.exit(0);
                }
                catch (error) {
                    logger.error({ err: error }, 'Error during shutdown');
                    process.exit(1);
                }
            });
            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after 30 seconds');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to start server');
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map