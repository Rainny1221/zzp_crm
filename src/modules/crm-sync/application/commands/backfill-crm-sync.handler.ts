import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_SYNC_LOG } from '../../domain/crm-sync.constants';
import type { ICrmSyncEnqueueRepository } from '../../domain/repositories/i-crm-sync-enqueue.repository';
import { I_CRM_SYNC_ENQUEUE_REPOSITORY } from '../../domain/repositories/i-crm-sync-enqueue.repository';
import {
  BackfillCrmSyncCommand,
  BackfillCrmSyncResult,
} from './backfill-crm-sync.command';

@CommandHandler(BackfillCrmSyncCommand)
export class BackfillCrmSyncHandler implements ICommandHandler<
  BackfillCrmSyncCommand,
  BackfillCrmSyncResult
> {
  constructor(
    @Inject(I_CRM_SYNC_ENQUEUE_REPOSITORY)
    private readonly enqueueRepo: ICrmSyncEnqueueRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: BackfillCrmSyncCommand,
  ): Promise<BackfillCrmSyncResult> {
    this.logger.info({
      message: 'CRM sync backfill requested',
      context: BackfillCrmSyncHandler.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.BACKFILL,
      entityType: CRM_SYNC_LOG.ENTITIES.USER,
      meta: {
        limit: command.limit,
      },
    });

    try {
      const users = await this.enqueueRepo.findUsersMissingSyncJobs(
        command.limit,
      );
      let enqueued = 0;

      for (const user of users) {
        const created = await this.enqueueRepo.enqueueUserCreatedJob(user.id);

        if (created) {
          enqueued += 1;
        }
      }

      const result = {
        limit: command.limit,
        scanned: users.length,
        enqueued,
        skipped: users.length - enqueued,
      };

      this.logger.info({
        message: 'CRM sync backfill completed',
        context: BackfillCrmSyncHandler.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.BACKFILL,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        meta: result,
      });

      return result;
    } catch (error: unknown) {
      const logEntry = {
        message: 'CRM sync backfill failed',
        context: BackfillCrmSyncHandler.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.BACKFILL,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        meta: {
          limit: command.limit,
          error: toErrorMeta(error),
        },
      };

      if (error instanceof BaseException && error.getStatus() < 500) {
        this.logger.warn(logEntry);
        throw error;
      }

      this.logger.error(logEntry);

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_PROCESSING_FAILED,
        'Failed to backfill CRM sync jobs',
        {
          limit: command.limit,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
