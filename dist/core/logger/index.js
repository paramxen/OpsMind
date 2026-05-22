import pino from 'pino';
import { getConfig } from '../config/index.js';
let logger;
const createLogger = () => {
    const config = getConfig();
    const pinoConfig = {
        level: config.LOG_LEVEL,
        transport: config.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            }
            : undefined,
    };
    return pino(pinoConfig);
};
const getLogger = () => {
    if (!logger) {
        logger = createLogger();
    }
    return logger;
};
export { getLogger, createLogger };
export default getLogger();
//# sourceMappingURL=index.js.map