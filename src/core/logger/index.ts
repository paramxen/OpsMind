import pino from 'pino';
import { getConfig } from '../config/index.js';

let logger: pino.Logger;

const createLogger = (): pino.Logger => {
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

const getLogger = (): pino.Logger => {
  if (!logger) {
    logger = createLogger();
  }
  return logger;
};

export { getLogger, createLogger };
export default getLogger();
