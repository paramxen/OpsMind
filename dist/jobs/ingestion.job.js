import { Queue, Worker } from 'bullmq';
import { getConfig } from '../core/config/index.js';
import { getLogger } from '../core/logger/index.js';
import { ingestPdf } from '../modules/ingestion/ingestion.service.js';
import { getDatabase } from '../core/database/index.js';
const logger = getLogger();
const config = getConfig();
// Parse Redis URL safely
const parseRedisUrl = (url) => {
    if (!url) {
        return {
            host: 'localhost',
            port: 6379,
        };
    }
    try {
        const parsed = new URL(url);
        const conf = {
            host: parsed.hostname || 'localhost',
            port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        };
        if (parsed.password) {
            return { ...conf, password: parsed.password };
        }
        return conf;
    }
    catch {
        return {
            host: 'localhost',
            port: 6379,
        };
    }
};
// Redis connection options
const redisConnection = {
    ...parseRedisUrl(config.REDIS_URL),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};
// Create queue
export const ingestionQueue = new Queue('ingestion', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
        },
        removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
        },
    },
});
// Job processor
export const ingestionWorker = new Worker('ingestion', async (job) => {
    const { documentId, filePath, userId, fileName } = job.data;
    try {
        logger.info({ jobId: job.id, documentId }, 'Processing ingestion job');
        // Update job progress
        await job.updateProgress(10);
        // Get database and update document status
        const db = getDatabase();
        await db.collection('documents').updateOne({ _id: documentId }, { $set: { status: 'processing' } });
        await job.updateProgress(20);
        // Process PDF
        await ingestPdf(filePath, documentId, userId);
        await job.updateProgress(90);
        // Mark document as completed
        await db.collection('documents').updateOne({ _id: documentId }, {
            $set: {
                status: 'completed',
                processedAt: new Date(),
            }
        });
        await job.updateProgress(100);
        logger.info({ jobId: job.id, documentId }, 'Ingestion job completed successfully');
        return { success: true, documentId };
    }
    catch (error) {
        logger.error({ err: error, jobId: job.id, documentId }, 'Ingestion job failed');
        const db = getDatabase();
        await db.collection('documents').updateOne({ _id: documentId }, {
            $set: {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        });
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 2, // Process 2 jobs concurrently
});
// Event handlers
ingestionWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
});
ingestionWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed');
});
ingestionWorker.on('error', (err) => {
    logger.error({ err }, 'Worker error');
});
// Queue events
ingestionQueue.on('error', (err) => {
    logger.error({ err }, 'Queue error');
});
export const addIngestionJob = async (data) => {
    const job = await ingestionQueue.add('process', data, {
        jobId: data.documentId,
    });
    logger.info({ jobId: job.id }, 'Ingestion job added to queue');
    return job;
};
export const getJobStatus = async (jobId) => {
    const job = await ingestionQueue.getJob(jobId);
    if (!job)
        return null;
    const state = await job.getState();
    return {
        jobId: job.id,
        state,
        progress: job._progress || 0,
        data: job.data,
        attempts: job.attemptsMade,
        failedReason: job.failedReason,
    };
};
export const cleanupJobs = async () => {
    try {
        // Clean up completed jobs older than 1 hour
        await ingestionQueue.clean(3600000, 100, 'completed');
        // Clean up failed jobs older than 24 hours
        await ingestionQueue.clean(86400000, 100, 'failed');
        logger.info('Job cleanup completed');
    }
    catch (error) {
        logger.error({ err: error }, 'Job cleanup failed');
    }
};
//# sourceMappingURL=ingestion.job.js.map