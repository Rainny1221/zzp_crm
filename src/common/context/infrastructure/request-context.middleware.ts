import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextService } from './request-context.service';

export const createRequestContextMiddleware =
  (requestContext: RequestContextService) =>
  (req: Request, res: Response, next: NextFunction) => {
    const incomingRequestId = req.header('x-request-id');
    const requestId = incomingRequestId || randomUUID();

    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    requestContext.run({ requestId }, () => {
      next();
    });
  };