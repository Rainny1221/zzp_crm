export type CrmSellerSyncUserRow = {
  id: number;
  email: string | null;
  username: string | null;
};

export type CrmSellerSyncSnapshot = {
  userId: number;
  email: string | null;
  username: string | null;
  isAuthorized: boolean;
  authorizedAt: Date | null;
};

export type CrmSellerSyncUpsertResult = {
  customerProfileId: number;
  dealId: number;
  pipelineRecordId: number | null;
};

export type CrmSellerSyncOutcome =
  | { skipped: true }
  | { skipped: false; result: CrmSellerSyncUpsertResult };
