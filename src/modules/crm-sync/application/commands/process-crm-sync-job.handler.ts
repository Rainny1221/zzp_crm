import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import {
  CRM_SYNC_JOB_STATUS,
  CRM_SYNC_LOG,
} from '../../domain/crm-sync.constants';
import type { CrmSyncEntity } from '../../domain/entities/crm-sync.entity';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
import { I_CRM_SYNC_REPOSITORY } from '../../domain/repositories/i-crm-sync.repository';
import type { ICrmSyncWriterRepository } from '../../domain/repositories/i-crm-sync-writer.repository';
import { I_CRM_SYNC_WRITER_REPOSITORY } from '../../domain/repositories/i-crm-sync-writer.repository';
import {
  ProcessCrmSyncJobCommand,
  ProcessCrmSyncJobResult,
} from './process-crm-sync-job.command';

@CommandHandler(ProcessCrmSyncJobCommand)
export class ProcessCrmSyncJobHandler implements ICommandHandler<
  ProcessCrmSyncJobCommand,
  ProcessCrmSyncJobResult
> {
  constructor(
    @Inject(I_CRM_SYNC_REPOSITORY)
    private readonly syncRepo: ICrmSyncRepository,

    @Inject(I_CRM_SYNC_WRITER_REPOSITORY)
    private readonly writerRepo: ICrmSyncWriterRepository,

    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: ProcessCrmSyncJobCommand,
  ): Promise<ProcessCrmSyncJobResult> {
    let claimedJob: CrmSyncEntity | null = null;

    this.logger.info({
      message: 'CRM sync job processing requested',
      context: ProcessCrmSyncJobHandler.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.PROCESS_JOB,
      entityType: CRM_SYNC_LOG.ENTITIES.JOB,
      entityId: command.jobId,
      meta: {
        jobId: command.jobId,
      },
    });

    try {
      claimedJob = await this.syncRepo.tryStartProcessing(command.jobId);

      if (!claimedJob) {
        const current = await this.syncRepo.findById(command.jobId);

        if (!current) {
          throw ErrorFactory.create(
            ErrorCode.CRM_SYNC_JOB_NOT_FOUND,
            `CRM sync job ${command.jobId} not found`,
            {
              jobId: command.jobId,
            },
          );
        }

        this.logger.info({
          message: 'CRM sync job skipped because it is not processable',
          context: ProcessCrmSyncJobHandler.name,
          module: CRM_SYNC_LOG.MODULE,
          action: CRM_SYNC_LOG.ACTIONS.PROCESS_JOB,
          entityType: CRM_SYNC_LOG.ENTITIES.JOB,
          entityId: current.id,
          meta: {
            jobId: current.id,
            status: current.status,
          },
        });

        return {
          id: current.id,
          status: current.status,
          skipped: true,
        };
      }

      const result = await this.writerRepo.syncFromUser(claimedJob.userId);

      await this.syncRepo.markSuccess(claimedJob.id);

      this.logger.info({
        message: 'CRM sync job processed successfully',
        context: ProcessCrmSyncJobHandler.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.PROCESS_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: claimedJob.id,
        meta: {
          jobId: claimedJob.id,
          userId: claimedJob.userId,
          result,
        },
      });

      return {
        id: claimedJob.id,
        status: CRM_SYNC_JOB_STATUS.SUCCESS,
        result,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown crm sync error';

      if (claimedJob) {
        try {
          await this.syncRepo.markFailed(claimedJob.id, message);
        } catch (markFailedError: unknown) {
          this.logger.error({
            message: 'Failed to mark CRM sync job as failed',
            context: ProcessCrmSyncJobHandler.name,
            module: CRM_SYNC_LOG.MODULE,
            action: CRM_SYNC_LOG.ACTIONS.MARK_FAILED,
            entityType: CRM_SYNC_LOG.ENTITIES.JOB,
            entityId: claimedJob.id,
            meta: {
              jobId: claimedJob.id,
              userId: claimedJob.userId,
              error: toErrorMeta(markFailedError),
            },
          });
        }
      }

      const logEntry = {
        message: 'CRM sync job processing failed',
        context: ProcessCrmSyncJobHandler.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.PROCESS_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: claimedJob?.id ?? command.jobId,
        meta: {
          jobId: claimedJob?.id ?? command.jobId,
          userId: claimedJob?.userId,
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
        'Failed to process CRM sync job',
        {
          jobId: claimedJob?.id ?? command.jobId,
          userId: claimedJob?.userId,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
