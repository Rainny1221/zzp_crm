export const I_CRM_SYNC_WRITER_REPOSITORY = Symbol(
  'I_CRM_SYNC_WRITER_REPOSITORY',
);

export interface ICrmSyncWriterRepository {
  syncFromUser(userId: number): Promise<{
    customerProfileId: number;
    dealId: number;
    pipelineRecordId: number | null;
  }>;
}
