import { CrmSyncEntity } from '../domain/entities/crm-sync.entity';
import type { CrmSyncJobStatus } from '../domain/crm-sync.constants';

export interface CrmSyncJobResponse {
  id: number;
  eventKey: string;
  eventType: string;
  userId: number;
  status: CrmSyncJobStatus;
  retryCount: number;
  lastError: string | null;
  lockedAt: Date | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CrmSyncPresenter {
  static toResponse(entity: CrmSyncEntity): CrmSyncJobResponse {
    return {
      id: entity.id,
      eventKey: entity.eventKey,
      eventType: entity.eventType,
      userId: entity.userId,
      status: entity.status,
      retryCount: entity.retryCount,
      lastError: entity.lastError,
      lockedAt: entity.lockedAt,
      processedAt: entity.processedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
