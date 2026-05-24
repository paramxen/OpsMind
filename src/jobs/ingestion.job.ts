import { Queue, Worker, Job } from 'bullmq';
import { getConfig } from '../core/config/index.js';
import { getLogger } from '../core/logger/index.js';
import { ingestPdf } from '../modules/ingestion/ingestion.service.js';
import { getDatabase } from '../core/database/index.js';

const logger = getLogger();
const config = getConfig();

// Parse Redis URL safely
const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const config = {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
    };
    if (parsed.password) {
      return { ...config, password: parsed.password };
    }
    return config;
  } catch {
    return {
      host: 'localhost',
      port: 6379,
    };
  }
};

// Redis connection options
const redisConnection: any = {
  ...parseRedisUrl(config.REDIS_URL || 'redis://localhost:6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export interface IngestJobData {
  documentId: string;
  filePath: string;
  userId: string;
  fileName: string;
}

// Create queue
export const ingestionQueue = new Queue<IngestJobData>('ingestion', {
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
export const ingestionWorker = new Worker<IngestJobData>(
  'ingestion',
  async (job: Job<IngestJobData>) => {
    const { documentId, filePath, userId, fileName } = job.data;
    
    try {
      logger.info({ jobId: job.id, documentId }, 'Processing ingestion job');
      
      // Update job progress
      await job.updateProgress(10);
      
      // Get database and update document status
      const db = getDatabase();
      await db.collection('documents').updateOne(
        { _id: documentId } as any,
        { $set: { status: 'processing' } }
      );
      
      await job.updateProgress(20);
      
      // Process PDF
      await ingestPdf(filePath, documentId, userId);
      
      await job.updateProgress(90);
      
      // Mark document as completed
      await db.collection('documents').updateOne(
        { _id: documentId } as any,
        { 
          $set: { 
            status: 'completed',
            processedAt: new Date(),
          } 
        }
      );
      
      await job.updateProgress(100);
      
      logger.info({ jobId: job.id, documentId }, 'Ingestion job completed successfully');
      
      return { success: true, documentId };
    } catch (error) {
      logger.error({ err: error, jobId: job.id, documentId }, 'Ingestion job failed');
      
      const db = getDatabase();
      await db.collection('documents').updateOne(
        { _id: documentId } as any,
        { 
          $set: { 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          } 
        }
      );
      
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 jobs concurrently
  }
);

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

export const addIngestionJob = async (data: IngestJobData) => {
  const job = await ingestionQueue.add('process', data, {
    jobId: data.documentId,
  });
  logger.info({ jobId: job.id }, 'Ingestion job added to queue');
  return job;
};

export const getJobStatus = async (jobId: string) => {
  const job = await ingestionQueue.getJob(jobId);
  if (!job) return null;
  
  const state = await job.getState();
  const progressValue = (typeof job.progress === 'number' ? job.progress : 0) as number;
  
  return {
    jobId: job.id,
    state,
    progress: progressValue,
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
  } catch (error) {
    logger.error({ err: error }, 'Job cleanup failed');
  }
};
