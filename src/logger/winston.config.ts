import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, errors, colorize, printf, json } = winston.format;

const isProd = process.env.NODE_ENV === 'production';
const service = process.env.APP_NAME || 'crm-backend';
const env = process.env.NODE_ENV || 'development';

const devFormat = printf((info) => {
  const {
    timestamp,
    level,
    message,
    context,
    module,
    action,
    entityType,
    entityId,
    meta,
    stack,
  } = info as any;

  const tags = [
    context ? `[${context}]` : '',
    module ? `[module:${module}]` : '',
    action ? `[action:${action}]` : '',
    entityType ? `[entity:${entityType}${entityId ? `:${entityId}` : ''}]` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const metaString =
    meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

  return `[${timestamp}] ${level} ${tags} ${stack || message}${metaString}`;
});

export const winstonConfig: WinstonModuleOptions = {
  level: isProd ? 'info' : 'debug',
  defaultMeta: {
    service,
    env,
  },
  format: combine(
    timestamp(),
    errors({ stack: true }),
  ),
  transports: [
    new winston.transports.Console({
      format: isProd
        ? combine(json())
        : combine(colorize(), devFormat),
    }),
  ],
};