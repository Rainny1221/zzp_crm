import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CrmSyncQueueService } from '../../infrastructure/queue/crm-sync-queue.service';
import {
  CRM_SYNC_JOB_STATUS,
  CRM_SYNC_LOG,
} from '../../domain/crm-sync.constants';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
import { I_CRM_SYNC_REPOSITORY } from '../../domain/repositories/i-crm-sync.repository';
import { CrmSyncPresenter } from '../../presentation/crm-sync.presenter';
import {
  ReplayCrmSyncJobCommand,
  ReplayCrmSyncJobResult,
} from './replay-crm-sync-job.command';

@CommandHandler(ReplayCrmSyncJobCommand)
export class ReplayCrmSyncJobHandler implements ICommandHandler<
  ReplayCrmSyncJobCommand,
  ReplayCrmSyncJobResult
> {
  constructor(
    @Inject(I_CRM_SYNC_REPOSITORY)
    private readonly syncRepo: ICrmSyncRepository,
    private readonly queueService: CrmSyncQueueService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: ReplayCrmSyncJobCommand,
  ): Promise<ReplayCrmSyncJobResult> {
    this.logger.info({
      message: 'CRM sync job replay requested',
      context: ReplayCrmSyncJobHandler.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.REQUEUE_JOB,
      entityType: CRM_SYNC_LOG.ENTITIES.JOB,
      entityId: command.jobId,
      meta: {
        jobId: command.jobId,
      },
    });

    try {
      const job = await this.syncRepo.findById(command.jobId);

      if (!job) {
        throw ErrorFactory.create(
          ErrorCode.CRM_SYNC_JOB_NOT_FOUND,
          `CRM sync job ${command.jobId} not found`,
          {
            jobId: command.jobId,
          },
        );
      }

      if (job.status !== CRM_SYNC_JOB_STATUS.FAILED) {
        throw ErrorFactory.create(
          ErrorCode.CRM_SYNC_JOB_NOT_REPLAYABLE,
          'Only failed CRM sync jobs can be replayed',
          {
            jobId: job.id,
            status: job.status,
            expectedStatus: CRM_SYNC_JOB_STATUS.FAILED,
          },
        );
      }

      const requeuedJob = await this.syncRepo.requeue(job.id);

      if (!requeuedJob) {
        throw ErrorFactory.create(
          ErrorCode.CRM_SYNC_JOB_NOT_REPLAYABLE,
          'CRM sync job cannot be replayed because its status changed',
          {
            jobId: job.id,
            previousStatus: job.status,
            expectedStatus: CRM_SYNC_JOB_STATUS.FAILED,
          },
        );
      }

      await this.queueService.enqueueProcessJob(requeuedJob.id);

      this.logger.info({
        message: 'CRM sync job replayed',
        context: ReplayCrmSyncJobHandler.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.REQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: requeuedJob.id,
        meta: {
          jobId: requeuedJob.id,
          status: requeuedJob.status,
        },
      });

      return CrmSyncPresenter.toResponse(requeuedJob);
    } catch (error: unknown) {
      const logEntry = {
        message: 'CRM sync job replay failed',
        context: ReplayCrmSyncJobHandler.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.REQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: command.jobId,
        meta: {
          jobId: command.jobId,
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
        'Failed to replay CRM sync job',
        {
          jobId: command.jobId,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
