import type {
  CrmSellerSyncSnapshot,
  CrmSellerSyncUpsertResult,
} from '../crm-seller-sync.types';

export const I_CRM_SYNC_WRITER_REPOSITORY = Symbol(
  'I_CRM_SYNC_WRITER_REPOSITORY',
);

export interface ICrmSyncWriterRepository {
  syncSellerSnapshot(
    snapshot: CrmSellerSyncSnapshot,
  ): Promise<CrmSellerSyncUpsertResult>;
}
