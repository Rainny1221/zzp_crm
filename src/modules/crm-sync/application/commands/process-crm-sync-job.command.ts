import { Command } from '@nestjs/cqrs';
import type { CrmSyncJobStatus } from '../../domain/crm-sync.constants';

export type ProcessCrmSyncJobResult = {
  id: number;
  status: CrmSyncJobStatus;
  skipped?: boolean;
  result?: {
    customerProfileId: number;
    dealId: number;
    pipelineRecordId: number | null;
  };
};

export class ProcessCrmSyncJobCommand extends Command<ProcessCrmSyncJobResult> {
  constructor(public readonly jobId: number) {
    super();
  }
}
