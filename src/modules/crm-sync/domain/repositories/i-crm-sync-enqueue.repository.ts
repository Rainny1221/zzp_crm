export const I_CRM_SYNC_ENQUEUE_REPOSITORY = Symbol(
  'I_CRM_SYNC_ENQUEUE_REPOSITORY',
);

export interface EnqueueCrmSyncJobResult {
  jobId: number;
  enqueued: boolean;
}

export interface ICrmSyncEnqueueRepository {
  findUsersMissingSyncJobs(limit: number): Promise<Array<{ id: number }>>;
  enqueueUserCreatedJob(userId: number): Promise<EnqueueCrmSyncJobResult>;
}
