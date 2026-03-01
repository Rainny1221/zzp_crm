import morgan from 'morgan';
import { LoggerService } from '@nestjs/common';

export const createMorganMiddleware = (logger: LoggerService) =>
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    skip: (req) => {
      const url = req.originalUrl || req.url;
      
      return (
        url.startsWith('/admin/queues') || 
        url.startsWith('/metrics') ||
        url.startsWith('/health') ||
        url.startsWith('/ready')
      );
    },
    stream: {
      write: (message: string) => {
        logger.log(message.trim(), 'HTTP');
      },
    },
  });