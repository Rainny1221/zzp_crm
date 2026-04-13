import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LoggerPort } from '../common/logging/application/logger.port';
import { LogEntry } from '../common/logging/application/log-entry';
import { RequestContextService } from '../common/context/infrastructure/request-context.service';

@Injectable()
export class AppLoggerService implements LoggerPort {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly requestContext: RequestContextService,
  ) {}

  debug(entry: LogEntry): void {
    this.logger.debug(this.toPayload(entry));
  }

  info(entry: LogEntry): void {
    this.logger.info(this.toPayload(entry));
  }

  warn(entry: LogEntry): void {
    this.logger.warn(this.toPayload(entry));
  }

  error(entry: LogEntry): void {
    this.logger.error(this.toPayload(entry));
  }

  private toPayload(entry: LogEntry) {
    return {
      message: entry.message,
      context: entry.context,
      module: entry.module,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      requestId: entry.requestId || this.requestContext.getRequestId(),
      userId: entry.userId || this.requestContext.getUserId(),
      meta: entry.meta,
    };
  }
}
