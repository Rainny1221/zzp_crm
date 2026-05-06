export const I_CRM_SYNC_ENQUEUE_REPOSITORY = Symbol(
  'I_CRM_SYNC_ENQUEUE_REPOSITORY',
);

export interface EnqueueCrmSyncJobResult {
  jobId: number;
  enqueued: boolean;
}

export type SellerMissingCrmSyncRow = {
  userId: number;
  authorizationId: number;
};

export interface ICrmSyncEnqueueRepository {
  /** Role-6 sellers with a valid TikTok auth row but no `crm_customer_profiles` row yet. */
  findSellersMissingCrmFromAuth(limit: number): Promise<SellerMissingCrmSyncRow[]>;
  enqueueTiktokAuthCreatedSyncJob(
    userId: number,
    authorizationId: number,
  ): Promise<EnqueueCrmSyncJobResult>;
}
