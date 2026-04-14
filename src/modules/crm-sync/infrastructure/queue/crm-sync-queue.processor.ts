import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { Job } from 'bullmq';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { ProcessCrmSyncJobCommand } from '../../application/commands';
import { CRM_SYNC_LOG, CRM_SYNC_QUEUE } from '../../domain/crm-sync.constants';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
import { I_CRM_SYNC_REPOSITORY } from '../../domain/repositories/i-crm-sync.repository';
import { CrmSyncQueueService } from './crm-sync-queue.service';

interface ProcessCrmSyncQueueJobData {
  jobId: number;
}

@Processor(CRM_SYNC_QUEUE.NAME)
export class CrmSyncQueueProcessor extends WorkerHost {
  constructor(
    @Inject(I_CRM_SYNC_REPOSITORY)
    private readonly syncRepo: ICrmSyncRepository,
    private readonly queueService: CrmSyncQueueService,
    private readonly commandBus: CommandBus,
    private readonly logger: AppLoggerService,
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, string>): Promise<unknown> {
    switch (job.name) {
      case CRM_SYNC_QUEUE.JOBS.DISPATCH_PENDING:
        return this.dispatchPendingJobs();

      case CRM_SYNC_QUEUE.JOBS.PROCESS_JOB:
        return this.processCrmSyncJob(job.data);

      default:
        this.logger.warn({
          message: 'Unknown CRM sync Bull job name',
          context: CrmSyncQueueProcessor.name,
          module: CRM_SYNC_LOG.MODULE,
          action: CRM_SYNC_LOG.ACTIONS.PROCESS_BULL_JOB,
          meta: { jobName: job.name },
        });

        return null;
    }
  }

  private async dispatchPendingJobs(): Promise<{ dispatched: number }> {
    const jobs = await this.syncRepo.findPendingBatch(
      CRM_SYNC_QUEUE.DISPATCH_BATCH_SIZE,
    );

    for (const job of jobs) {
      await this.queueService.enqueueProcessJob(job.id);
    }

    if (jobs.length) {
      this.logger.info({
        message: 'Dispatched pending CRM sync jobs to BullMQ',
        context: CrmSyncQueueProcessor.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.DISPATCH_PENDING_JOBS,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        meta: {
          count: jobs.length,
        },
      });
    }

    return { dispatched: jobs.length };
  }

  private async processCrmSyncJob(data: unknown): Promise<unknown> {
    if (!this.isProcessJobData(data)) {
      this.logger.warn({
        message: 'Invalid CRM sync process Bull job data',
        context: CrmSyncQueueProcessor.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.PROCESS_BULL_JOB,
        meta: { data },
      });

      return null;
    }

    return this.commandBus.execute(new ProcessCrmSyncJobCommand(data.jobId));
  }

  private isProcessJobData(data: unknown): data is ProcessCrmSyncQueueJobData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'jobId' in data &&
      typeof data.jobId === 'number' &&
      Number.isInteger(data.jobId) &&
      data.jobId > 0
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<unknown, unknown, string> | undefined, error: Error): void {
    this.logger.error({
      message: 'CRM sync Bull job failed',
      context: CrmSyncQueueProcessor.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.BULL_JOB_FAILED,
      meta: {
        jobId: job?.id,
        jobName: job?.name,
        data: job?.data,
        error: toErrorMeta(error),
      },
    });
  }
}
