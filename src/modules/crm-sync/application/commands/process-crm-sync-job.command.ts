import { Command } from '@nestjs/cqrs';

export type ProcessCrmSyncJobResult = {
  id: number;
  status: string;
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
