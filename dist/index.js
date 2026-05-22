import fs from 'fs/promises';
import app from './app.js';
import { getConfig } from './core/config/index.js';
import { connectDatabase, ensureIndexes, disconnectDatabase } from './core/database/index.js';
import { getLogger } from './core/logger/index.js';
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
        // Start server
        const server = app.listen(config.PORT, () => {
            logger.info({
                port: config.PORT,
                environment: config.NODE_ENV,
                timestamp: new Date().toISOString(),
            }, 'OpsMind AI server started');
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info({ signal }, 'Shutdown signal received');
            server.close(async () => {
                try {
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