import type {
  CustomerReadModel,
  CustomerRecordResponse,
  CustomerRelationship,
  CustomerTaskLite,
  UserLite,
} from '../queries';
import type { CrmCustomerListRow } from '../../infrastructure/repositories/crm-customers-read.repository';

const toIsoString = (value: Date | null): string | null =>
  value ? value.toISOString() : null;

const toUserLite = (row: CrmCustomerListRow): UserLite | null => {
  if (row.assigneeId === null) return null;

  return {
    id: String(row.assigneeId),
    name: row.assigneeName ?? row.assigneeEmail ?? `User ${row.assigneeId}`,
    email: row.assigneeEmail,
    avatar: row.assigneeAvatar,
    role: row.assigneeRole,
  };
};

const toNextTask = (row: CrmCustomerListRow): CustomerTaskLite | null => {
  if (!row.nextTaskId || !row.nextTaskDueAt) return null;

  return {
    id: row.nextTaskId,
    title: row.nextTaskTitle ?? 'Untitled task',
    dueAt: row.nextTaskDueAt.toISOString(),
    priority: row.nextTaskPriority,
  };
};

const toRelationship = (status: string | null): CustomerRelationship => {
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

export const toCustomerReadModel = (
  row: CrmCustomerListRow,
): CustomerReadModel => {
  const owner = toUserLite(row);
  const nextTask = toNextTask(row);
  const lastActivityAt =
    row.lastActivityAt ?? row.lastContactedAt ?? row.customerCreatedAt;

  return {
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
    notes: [],
    profile: {
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
    },
    ownership: {
      assigneeId: row.assigneeId === null ? null : String(row.assigneeId),
      owner,
    },
    deal: {
      id: row.dealId,
      status: row.statusCode,
      pipelineStage: row.pipelineStageCode,
      productPackage: row.productPackageCode,
      dealValue: row.dealValue,
      revenue: row.revenue,
      probability: row.probability,
      failureReason: row.failureReasonCode,
      failureNote: row.failureNote,
    },
    timeline: {
      lastActivityAt: lastActivityAt.toISOString(),
      lastContactedAt: toIsoString(row.lastContactedAt),
      openTaskCount: row.openTaskCount,
      nextTask,
    },
  };
};

export const toCustomerRecordResponse = (
  row: CrmCustomerListRow,
): CustomerRecordResponse => {
  const customer = toCustomerReadModel(row);
  const owner = toUserLite(row);
  const nextTask = toNextTask(row);
  const lastActivityAt =
    row.lastActivityAt ?? row.lastContactedAt ?? row.customerCreatedAt;

  return {
    customer,
    ...(owner ? { owner } : {}),
    relationship: toRelationship(row.statusCode),
    lastActivityAt: lastActivityAt.toISOString(),
    openTaskCount: row.openTaskCount,
    nextTask,
    activeDealValue: row.dealValue,
  };
};
