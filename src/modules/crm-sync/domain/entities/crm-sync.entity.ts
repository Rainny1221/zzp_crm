import {
  CRM_SYNC_JOB_STATUS,
  type CrmSyncJobStatus,
} from '../crm-sync.constants';

export type { CrmSyncJobStatus };

export class CrmSyncEntity {
  constructor(
    public readonly id: number,
    public readonly eventKey: string,
    public readonly eventType: string,
    public readonly userId: number,
    public readonly payload: Record<string, unknown> | null,
    public status: CrmSyncJobStatus,
    public retryCount: number,
    public lastError: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lockedAt: Date | null = null,
    public readonly processedAt: Date | null = null,
  ) {}

  canProcess(): boolean {
    return (
      this.status === CRM_SYNC_JOB_STATUS.PENDING ||
      this.status === CRM_SYNC_JOB_STATUS.FAILED
    );
  }
}
