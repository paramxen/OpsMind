import { Queue, Worker, Job } from 'bullmq';
export interface IngestJobData {
    documentId: string;
    filePath: string;
    userId: string;
    fileName: string;
}
export declare const ingestionQueue: Queue<IngestJobData, any, string, IngestJobData, any, string>;
export declare const ingestionWorker: Worker<IngestJobData, any, string>;
export declare const addIngestionJob: (data: IngestJobData) => Promise<Job<IngestJobData, any, string>>;
export declare const getJobStatus: (jobId: string) => Promise<{
    jobId: string | undefined;
    state: "unknown" | import("bullmq").JobState;
    progress: any;
    data: IngestJobData;
    attempts: number;
    failedReason: string;
} | null>;
export declare const cleanupJobs: () => Promise<void>;
//# sourceMappingURL=ingestion.job.d.ts.map