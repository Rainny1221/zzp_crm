import { Command } from '@nestjs/cqrs';
import type { CrmSyncJobResponse } from '../../presentation/crm-sync.presenter';

export type ReplayCrmSyncJobResult = CrmSyncJobResponse;

export class ReplayCrmSyncJobCommand extends Command<ReplayCrmSyncJobResult> {
  constructor(public readonly jobId: number) {
    super();
  }
}
