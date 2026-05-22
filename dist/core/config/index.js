import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    // Database
    MONGO_URI: z.string().min(1),
    MONGO_DB_NAME: z.string().default('opsmind'),
    REDIS_URL: z.string().optional(),
    // API Keys
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_API_BASE: z.string().default('https://api.openai.com/v1'),
    OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-large'),
    GEMINI_API_KEY: z.string().optional(),
    // File Upload
    MAX_FILE_SIZE_BYTES: z.coerce.number().default(50 * 1024 * 1024),
    UPLOAD_MAX_FILES: z.coerce.number().default(5),
    UPLOAD_DIR: z.string().default('storage/uploads'),
    // Embedding
    EMBEDDING_BATCH_SIZE: z.coerce.number().default(16),
    // Auth
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
    // Security
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    // Features
    ENABLE_TELEMETRY: z.coerce.boolean().default(true),
});
let config;
const validateConfig = () => {
    try {
        const result = envSchema.safeParse(process.env);
        if (!result.success) {
            const errors = result.error.errors
                .map(e => `${e.path.join('.')}: ${e.message}`)
                .join('\n');
            throw new Error(`Environment validation failed:\n${errors}`);
        }
        return result.data;
    }
    catch (error) {
        console.error('Failed to validate environment variables', error);
        process.exit(1);
    }
};
const getConfig = () => {
    if (!config) {
        config = validateConfig();
    }
    return config;
};
export { getConfig };
//# sourceMappingURL=index.js.map