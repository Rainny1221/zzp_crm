import { Command } from '@nestjs/cqrs';

export interface BackfillCrmSyncResult {
  limit: number;
  scanned: number;
  enqueued: number;
  skipped: number;
}

export class BackfillCrmSyncCommand extends Command<BackfillCrmSyncResult> {
  constructor(public readonly limit: number) {
    super();
  }
}
