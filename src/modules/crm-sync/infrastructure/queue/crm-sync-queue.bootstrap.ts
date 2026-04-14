import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_SYNC_LOG, CRM_SYNC_QUEUE } from '../../domain/crm-sync.constants';

@Injectable()
export class CrmSyncQueueBootstrap implements OnModuleInit {
  constructor(
    @InjectQueue(CRM_SYNC_QUEUE.NAME)
    private readonly queue: Queue,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      CRM_SYNC_QUEUE.JOBS.DISPATCH_PENDING,
      {},
      {
        repeat: { every: CRM_SYNC_QUEUE.DISPATCH_EVERY_MS },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );

    this.logger.info({
      message: 'CRM sync repeatable dispatch job registered',
      context: CrmSyncQueueBootstrap.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.REGISTER_REPEATABLE_JOB,
      meta: {
        queue: CRM_SYNC_QUEUE.NAME,
        jobName: CRM_SYNC_QUEUE.JOBS.DISPATCH_PENDING,
        everyMs: CRM_SYNC_QUEUE.DISPATCH_EVERY_MS,
      },
    });
  }
}
