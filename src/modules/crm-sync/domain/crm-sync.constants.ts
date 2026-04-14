export const CRM_SYNC_JOB_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

export type CrmSyncJobStatus =
  (typeof CRM_SYNC_JOB_STATUS)[keyof typeof CRM_SYNC_JOB_STATUS];

export const CRM_SYNC_JOB_STATUS_VALUES = [
  CRM_SYNC_JOB_STATUS.PENDING,
  CRM_SYNC_JOB_STATUS.PROCESSING,
  CRM_SYNC_JOB_STATUS.SUCCESS,
  CRM_SYNC_JOB_STATUS.FAILED,
] as const;

export const CRM_SYNC_PROCESSABLE_STATUSES: CrmSyncJobStatus[] = [
  CRM_SYNC_JOB_STATUS.PENDING,
  CRM_SYNC_JOB_STATUS.FAILED,
];

export const CRM_SYNC_EVENT_TYPE = {
  USER_CREATED: 'USER_CREATED',
} as const;

export type CrmSyncEventType =
  (typeof CRM_SYNC_EVENT_TYPE)[keyof typeof CRM_SYNC_EVENT_TYPE];

export const buildCrmSyncEventKey = (
  eventType: CrmSyncEventType,
  entityId: number,
): string => `${eventType}:${entityId}`;

export const CRM_SYNC_QUEUE = {
  NAME: 'crm-sync',
  JOBS: {
    DISPATCH_PENDING: 'dispatch-pending',
    PROCESS_JOB: 'process-job',
  },
  PROCESS_JOB_ID_PREFIX: 'crm-sync:process',
  DISPATCH_EVERY_MS: 10_000,
  DISPATCH_BATCH_SIZE: 20,
} as const;

export const buildCrmSyncProcessQueueJobId = (jobId: number): string =>
  `${CRM_SYNC_QUEUE.PROCESS_JOB_ID_PREFIX}:${jobId}`;

export const CRM_PRODUCT_PACKAGE_CODE = {
  TRIAL: 'trial',
  PACKAGE_399: '399',
  PACKAGE_699: '699',
} as const;

export type CrmProductPackageCode =
  (typeof CRM_PRODUCT_PACKAGE_CODE)[keyof typeof CRM_PRODUCT_PACKAGE_CODE];

export const CRM_PRODUCT_PACKAGE_OPTIONS = [
  {
    code: CRM_PRODUCT_PACKAGE_CODE.TRIAL,
    label: 'Trial',
    sortOrder: 1,
    isActive: true,
  },
  {
    code: CRM_PRODUCT_PACKAGE_CODE.PACKAGE_399,
    label: 'Gói 399k',
    sortOrder: 2,
    isActive: true,
  },
  {
    code: CRM_PRODUCT_PACKAGE_CODE.PACKAGE_699,
    label: 'Gói 699k',
    sortOrder: 3,
    isActive: true,
  },
] as const;

export const CRM_CUSTOMER_TIER_CODE = {
  TINY: 'tiny',
  POTENTIAL: 'potential',
  WHALE: 'whale',
} as const;

export type CrmCustomerTierCode =
  (typeof CRM_CUSTOMER_TIER_CODE)[keyof typeof CRM_CUSTOMER_TIER_CODE];

export const CRM_CUSTOMER_TIER_OPTIONS = [
  {
    code: CRM_CUSTOMER_TIER_CODE.TINY,
    label: 'Tiny',
    isActive: true,
  },
  {
    code: CRM_CUSTOMER_TIER_CODE.POTENTIAL,
    label: 'Potential',
    isActive: true,
  },
  {
    code: CRM_CUSTOMER_TIER_CODE.WHALE,
    label: 'Whale',
    isActive: true,
  },
] as const;

export const CRM_SYNC_DEFAULTS = {
  SOURCE_CODE: 'website',
  CUSTOMER_TIER_CODE: null as CrmCustomerTierCode | null,
  PIPELINE_STAGE: 'NEW_LEAD',
  PIPELINE_MAPPED_STATUS_CODE: 'NEW',
  PRODUCT_PACKAGE_CODE: CRM_PRODUCT_PACKAGE_CODE.TRIAL,
  PROBABILITY: 0,
} as const;

export const CRM_SYNC_TRANSACTION = {
  MAX_WAIT_MS: 1000,
  LOCK_TIMEOUT_MS: 1000,
  TIMEOUT_MS: 3000,
} as const;

export const CRM_SYNC_LOG = {
  MODULE: 'crm-sync',
  ENTITIES: {
    JOB: 'CRM_SYNC_JOB',
    USER: 'USER',
    PIPELINE_STAGE: 'CRM_PIPELINE_STAGE',
    PRODUCT_PACKAGE: 'CRM_PRODUCT_PACKAGE',
  },
  ACTIONS: {
    FIND_JOB: 'CRM_SYNC_FIND_JOB',
    LIST_JOBS: 'CRM_SYNC_LIST_JOBS',
    CLAIM_JOB: 'CRM_SYNC_CLAIM_JOB',
    MARK_SUCCESS: 'CRM_SYNC_MARK_SUCCESS',
    MARK_FAILED: 'CRM_SYNC_MARK_FAILED',
    REQUEUE_JOB: 'CRM_SYNC_REQUEUE_JOB',
    PROCESS_JOB: 'CRM_SYNC_PROCESS_JOB',
    SYNC_FROM_USER: 'CRM_SYNC_FROM_USER',
    BACKFILL: 'CRM_SYNC_BACKFILL',
    ENQUEUE_JOB: 'CRM_SYNC_ENQUEUE_JOB',
    REGISTER_REPEATABLE_JOB: 'CRM_SYNC_REGISTER_REPEATABLE_JOB',
    PROCESS_BULL_JOB: 'CRM_SYNC_PROCESS_BULL_JOB',
    DISPATCH_PENDING_JOBS: 'CRM_SYNC_DISPATCH_PENDING_JOBS',
    BULL_JOB_FAILED: 'CRM_SYNC_BULL_JOB_FAILED',
  },
} as const;
