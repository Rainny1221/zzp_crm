import type {
  PipelineCustomerReadModel,
  PipelineDealRecordResponse,
  PipelineRelationship,
  PipelineUserLite,
} from '../queries';
import type { CrmPipelineTableRow } from '../../infrastructure/repositories/crm-pipeline-read.repository';

const STUCK_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const CLOSING_STAGES = new Set(['negotiation', 'close_deal']);
const INACTIVE_STATUSES = new Set(['success', 'failed']);

const toIsoString = (value: Date | null): string | null =>
  value ? value.toISOString() : null;

const toRelationship = (status: string | null): PipelineRelationship => {
  switch (status?.toLowerCase()) {
    case 'trial':
      return 'trial';
    case 'success':
    case 'won':
      return 'paid';
    case 'failed':
    case 'fail':
    case 'lost':
      return 'lost';
    case 'new':
    default:
      return 'lead';
  }
};

const toOwner = (row: CrmPipelineTableRow): PipelineUserLite | null => {
  if (row.assigneeId === null) return null;

  return {
    id: String(row.assigneeId),
    name: row.assigneeName ?? row.assigneeEmail ?? `User ${row.assigneeId}`,
    email: row.assigneeEmail,
    avatar: row.assigneeAvatar,
    role: row.assigneeRole,
  };
};

const toCustomer = (row: CrmPipelineTableRow): PipelineCustomerReadModel => ({
  id: row.customerId,
  userId: row.userId,
  shopName: row.shopName,
  tiktokLink: row.tiktokLink,
  phone: row.phone,
  email: row.email,
  gmvMonthly: row.gmvMonthly,
  industry: row.industry,
  jobTitle: row.jobTitle,
  province: row.province,
  tier: row.tierCode,
  source: row.sourceCode,
  partnerName: row.partnerName,
  sourceNote: row.sourceNote,
  assigneeId: row.assigneeId === null ? null : String(row.assigneeId),
  status: row.statusCode,
  pipelineStage: row.pipelineStageCode,
  trialStartDate: toIsoString(row.trialStartAt),
  trialEndDate: toIsoString(row.trialEndAt),
  payment: null,
  revenue: row.revenue,
  dealValue: row.dealValue,
  productPackage: row.productPackageCode,
  failureReason: row.failureReasonCode,
  failureNote: row.failureNote,
  createdAt: row.customerCreatedAt.toISOString(),
  syncedAt: toIsoString(row.syncedAt),
  lastContactedAt: toIsoString(row.lastContactedAt),
});

const isActiveDeal = (status: string | null): boolean =>
  !INACTIVE_STATUSES.has(status ?? '');

const isStuckDeal = (row: CrmPipelineTableRow): boolean => {
  if (!isActiveDeal(row.statusCode)) return false;

  const baseline =
    row.lastActivityAt ??
    row.lastContactedAt ??
    row.stageTransitionAt ??
    row.customerCreatedAt;

  return Date.now() - baseline.getTime() > STUCK_AFTER_MS;
};

export const toPipelineDealRecordResponse = (
  row: CrmPipelineTableRow,
): PipelineDealRecordResponse => {
  const owner = toOwner(row);
  const lastActivityAt =
    row.lastActivityAt ??
    row.lastContactedAt ??
    row.stageTransitionAt ??
    row.customerCreatedAt;
  const stageTransitionAt = row.stageTransitionAt ?? row.customerCreatedAt;

  return {
    id: row.dealId,
    customer: toCustomer(row),
    ...(owner ? { owner } : {}),
    relationship: toRelationship(row.statusCode),
    probability: row.probability,
    value: row.dealValue ?? 0,
    openTaskCount: row.openTaskCount,
    isClosing: CLOSING_STAGES.has(row.pipelineStageCode),
    isStuck: isStuckDeal(row),
    isActive: isActiveDeal(row.statusCode),
    lastActivityAt: lastActivityAt.toISOString(),
    stageTransitionAt: stageTransitionAt.toISOString(),
  };
};
