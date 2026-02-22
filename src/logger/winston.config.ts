import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const isProd = process.env.NODE_ENV === 'production';

export const winstonConfig: WinstonModuleOptions = {
  level: isProd ? 'info' : 'debug',

  format: combine(
    timestamp(),
    errors({ stack: true }),
    json(),
  ),

  transports: [
    new winston.transports.Console({
      format: isProd
        ? json()
        : combine(
            colorize(),
            printf(({ level, message, timestamp, context, stack }) => {
              return `[${timestamp}] ${level} ${
                context ? `[${context}]` : ''
              } ${stack || message}`;
            }),
          ),
    }),
  ],
};