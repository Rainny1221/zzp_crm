import { Command } from '@nestjs/cqrs';

export interface ProcessCrmSyncJobResult {
  id: number;
  status: 'SUCCESS' | 'PENDING' | 'PROCESSING' | 'FAILED';
  skipped?: boolean;
  result?: {
    customerProfileId: number;
    dealId: number;
    pipelineRecordId: number | null;
  };
}

export class ProcessCrmSyncJobCommand extends Command<ProcessCrmSyncJobResult> {
  constructor(public readonly jobId: number) {
    super();
  }
}
