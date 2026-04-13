import morgan from 'morgan';
import { AppLoggerService } from './app-logger.service';

export const createMorganMiddleware = (logger: AppLoggerService) =>
  morgan(
    (tokens, req, res) => {
      const user = req.user;

      const payload = {
        message: 'HTTP request completed',
        context: 'HttpLogger',
        module: 'http',
        action: 'HTTP_REQUEST',
        entityType: 'HTTP',
        requestId: res.getHeader('x-request-id')?.toString(),
        userId: user?.sub
          ? String(user.sub)
          : user?.id
            ? String(user.id)
            : undefined,
        meta: {
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          statusCode: Number(tokens.status(req, res)),
          contentLength: Number(tokens.res(req, res, 'content-length') || 0),
          responseTimeMs: Number(tokens['response-time'](req, res)),
        },
      };

      return JSON.stringify(payload);
    },
    {
      skip: (req) =>
        req.originalUrl.startsWith('/metrics') ||
        req.originalUrl.startsWith('/health') ||
        req.originalUrl.startsWith('/ready') ||
        req.originalUrl.startsWith('/admin/queues'),
      stream: {
        write: (message: string) => {
          try {
            const parsed = JSON.parse(message.trim());
            logger.info(parsed);
          } catch {
            logger.warn({
              message: 'Failed to parse Morgan log payload',
              context: 'HttpLogger',
              module: 'http',
              action: 'HTTP_LOG_PARSE_FAILED',
              entityType: 'HTTP',
              meta: {
                raw: message.trim(),
              },
            });
          }
        },
      },
    },
  );
