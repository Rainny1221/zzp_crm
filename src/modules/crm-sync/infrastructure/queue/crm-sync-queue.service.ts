import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import {
  buildCrmSyncProcessQueueJobId,
  CRM_SYNC_LOG,
  CRM_SYNC_QUEUE,
} from '../../domain/crm-sync.constants';

const TERMINAL_BULL_STATES = new Set(['completed', 'failed']);

@Injectable()
export class CrmSyncQueueService {
  constructor(
    @InjectQueue(CRM_SYNC_QUEUE.NAME)
    private readonly queue: Queue,
    private readonly logger: AppLoggerService,
  ) {}

  async enqueueProcessJob(jobId: number): Promise<void> {
    const queueJobId = buildCrmSyncProcessQueueJobId(jobId);

    await this.removeTerminalJob(queueJobId);

    await this.queue.add(
      CRM_SYNC_QUEUE.JOBS.PROCESS_JOB,
      { jobId },
      {
        jobId: queueJobId,
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );

    this.logger.debug({
      message: 'CRM sync process job enqueued',
      context: CrmSyncQueueService.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.ENQUEUE_JOB,
      entityType: CRM_SYNC_LOG.ENTITIES.JOB,
      entityId: jobId,
      meta: {
        queue: CRM_SYNC_QUEUE.NAME,
        queueJobId,
        jobId,
      },
    });
  }

  private async removeTerminalJob(queueJobId: string): Promise<void> {
    const existingJob = await this.queue.getJob(queueJobId);

    if (!existingJob) return;

    const state = await existingJob.getState();

    if (!TERMINAL_BULL_STATES.has(state)) return;

    try {
      await existingJob.remove();
    } catch (error: unknown) {
      this.logger.warn({
        message: 'Failed to remove terminal CRM sync Bull job before enqueue',
        context: CrmSyncQueueService.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.ENQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: queueJobId,
        meta: {
          queue: CRM_SYNC_QUEUE.NAME,
          queueJobId,
          state,
          error: toErrorMeta(error),
        },
      });
    }
  }
}
