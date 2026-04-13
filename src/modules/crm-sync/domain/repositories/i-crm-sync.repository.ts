import { CrmSyncEntity } from '../entities/crm-sync.entity';

export const I_CRM_SYNC_REPOSITORY = Symbol('I_CRM_SYNC_REPOSITORY');

export interface ICrmSyncRepository {
  findById(id: number): Promise<CrmSyncEntity | null>;
  markProcessing(id: number): Promise<void>;
  markSuccess(id: number): Promise<void>;
  markFailed(id: number, error: string): Promise<void>;
}
