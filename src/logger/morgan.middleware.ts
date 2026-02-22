import morgan from 'morgan';
import { LoggerService } from '@nestjs/common';

export const createMorganMiddleware = (logger: LoggerService) =>
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message: string) => {
        logger.log(message.trim(), 'HTTP');
      },
    },
  });