import { CrmSyncEntity } from '../entities/crm-sync.entity';
import type { CrmSyncJobStatus } from '../crm-sync.constants';

export const I_CRM_SYNC_REPOSITORY = Symbol('I_CRM_SYNC_REPOSITORY');

export interface FindCrmSyncJobsParams {
  status?: CrmSyncJobStatus;
  eventType?: string;
  page: number;
  limit: number;
}

export interface FindCrmSyncJobsResult {
  items: CrmSyncEntity[];
  total: number;
}

export interface ICrmSyncRepository {
  findById(id: number): Promise<CrmSyncEntity | null>;
  findMany(params: FindCrmSyncJobsParams): Promise<FindCrmSyncJobsResult>;
  tryStartProcessing(id: number): Promise<CrmSyncEntity | null>;
  requeue(id: number): Promise<CrmSyncEntity | null>;
  markSuccess(id: number): Promise<void>;
  markFailed(id: number, error: string): Promise<void>;
}
