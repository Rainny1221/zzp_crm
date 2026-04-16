export const CRM_CUSTOMERS_LOG = {
  MODULE: 'crm-customers',
  ACTIONS: {
    CREATE_CUSTOMER: 'CRM_CUSTOMERS_CREATE_CUSTOMER',
    CREATE_INTERACTION: 'CRM_CUSTOMERS_CREATE_INTERACTION',
    GET_CUSTOMER_DETAIL: 'CRM_CUSTOMERS_GET_DETAIL',
    LIST_CUSTOMERS: 'CRM_CUSTOMERS_LIST',
    CREATE_NOTE: 'CRM_CUSTOMERS_CREATE_NOTE',
    UPDATE_ASSIGNMENT: 'CRM_CUSTOMERS_UPDATE_ASSIGNMENT',
    UPDATE_PIPELINE_STAGE: 'CRM_CUSTOMERS_UPDATE_PIPELINE_STAGE',
    UPDATE_PRODUCT_PACKAGE: 'CRM_CUSTOMERS_UPDATE_PRODUCT_PACKAGE',
  },
  ENTITIES: {
    ASSIGNEE: 'CRM_ASSIGNEE',
    CUSTOMER: 'CRM_CUSTOMER',
    DEAL: 'CRM_DEAL',
  },
} as const;

export const CRM_ACTIVITY_TYPE = {
  ASSIGNMENT_CHANGED: 'assignment_changed',
  CALL_LOGGED: 'call_logged',
  CUSTOMER_CREATED: 'customer_created',
  MESSAGE_LOGGED: 'message_logged',
  NOTE_ADDED: 'note_added',
  PIPELINE_STAGE_CHANGED: 'pipeline_stage_changed',
  PRODUCT_PACKAGE_CHANGED: 'product_package_changed',
  UNASSIGNED: 'unassigned',
} as const;

export const CRM_INTERACTION_CHANNEL_CODES = ['call', 'message'] as const;

export type CrmInteractionChannelCode =
  (typeof CRM_INTERACTION_CHANNEL_CODES)[number];

export const CRM_CUSTOMER_ASSIGNABLE_ROLE_NAMES = [
  'ADMIN',
  'SALE_MANAGER',
  'SALE',
] as const;

export const CRM_PIPELINE_STAGE_CODES = [
  'new_lead',
  'connect',
  'qualified',
  'booking_demo',
  'demo',
  'proposal',
  'negotiation',
  'close_deal',
  'fail',
  'lost_unqualified',
] as const;

export type CrmPipelineStageCode = (typeof CRM_PIPELINE_STAGE_CODES)[number];

export const CRM_DEAL_STATUS_CODES = [
  'new',
  'trial',
  'success',
  'failed',
] as const;

export type CrmDealStatusCode = (typeof CRM_DEAL_STATUS_CODES)[number];

export const CRM_PIPELINE_STAGE_TO_STATUS = {
  new_lead: 'new',
  connect: 'new',
  qualified: 'trial',
  booking_demo: 'trial',
  demo: 'trial',
  proposal: 'trial',
  negotiation: 'trial',
  close_deal: 'success',
  fail: 'failed',
  lost_unqualified: 'failed',
} as const satisfies Record<CrmPipelineStageCode, CrmDealStatusCode>;

export const CRM_FAILURE_PIPELINE_STAGES = [
  'fail',
  'lost_unqualified',
] as const satisfies readonly CrmPipelineStageCode[];

export const CRM_PRODUCT_PACKAGE_CODES = ['trial', '399', '699'] as const;

export type CrmProductPackageCode = (typeof CRM_PRODUCT_PACKAGE_CODES)[number];

export const CRM_CUSTOMER_CREATE_DEFAULTS = {
  SOURCE_CODE: 'manual',
  PIPELINE_STAGE_CODE: 'new_lead',
  PRODUCT_PACKAGE_CODE: 'trial',
  DEAL_VALUE: 0,
  PROBABILITY: 0,
} as const;

export const CRM_CUSTOMER_TIER_GMV_THRESHOLDS = {
  POTENTIAL: 100_000_000,
  WHALE: 1_000_000_000,
} as const;
