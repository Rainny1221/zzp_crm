import { LoggerPort } from './logger.port';

interface BusinessLogParams {
  message: string;
  context: string;
  module: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  meta?: Record<string, unknown>;
}

export function logBusinessEvent(
  logger: LoggerPort,
  params: BusinessLogParams,
): void {
  logger.info({
    message: params.message,
    context: params.context,
    module: params.module,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    meta: params.meta,
  });
}
