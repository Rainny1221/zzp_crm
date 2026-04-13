import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
import { I_CRM_SYNC_REPOSITORY } from '../../domain/repositories/i-crm-sync.repository';
import type { ICrmSyncWriterRepository } from '../../domain/repositories/i-crm-sync-writer.repository';
import { I_CRM_SYNC_WRITER_REPOSITORY } from '../../domain/repositories/i-crm-sync-writer.repository';
import {
  ProcessCrmSyncJobCommand,
  ProcessCrmSyncJobResult,
} from './process-crm-sync-job.command';

@CommandHandler(ProcessCrmSyncJobCommand)
export class ProcessCrmSyncJobHandler implements ICommandHandler<ProcessCrmSyncJobCommand> {
  constructor(
    @Inject(I_CRM_SYNC_REPOSITORY)
    private readonly syncRepo: ICrmSyncRepository,

    @Inject(I_CRM_SYNC_WRITER_REPOSITORY)
    private readonly writerRepo: ICrmSyncWriterRepository,
  ) {}

  async execute(
    command: ProcessCrmSyncJobCommand,
  ): Promise<ProcessCrmSyncJobResult> {
    const job = await this.syncRepo.findById(command.jobId);

    if (!job) {
      throw new Error(`Crm sync job ${command.jobId} not found`);
    }

    if (!job.canProcess()) {
      return {
        id: job.id,
        status: job.status,
        skipped: true,
      };
    }

    await this.syncRepo.markProcessing(job.id);

    try {
      const result = await this.writerRepo.syncFromUser(job.userId);

      await this.syncRepo.markSuccess(job.id);

      return {
        id: job.id,
        status: 'SUCCESS',
        result,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown crm sync error';

      await this.syncRepo.markFailed(job.id, message);

      throw error;
    }
  }
}
