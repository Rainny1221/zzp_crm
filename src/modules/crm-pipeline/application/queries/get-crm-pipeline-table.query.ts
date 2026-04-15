import { Query } from '@nestjs/cqrs';
import type {
  CrmPipelineTableBooleanFilter,
  CrmPipelineTableFocus,
  CrmPipelineTableSortDirection,
  CrmPipelineTableSortKey,
} from '../../presentation/dto/get-crm-pipeline-table.dto';

export type PipelineRelationship = 'lead' | 'trial' | 'paid' | 'lost';

export interface PipelineUserLite {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string | null;
}

export interface PipelineCustomerReadModel {
  id: string;
  userId: number;
  shopName: string | null;
  tiktokLink: string | null;
  phone: string | null;
  email: string | null;
  gmvMonthly: number | null;
  industry: string | null;
  jobTitle: string | null;
  province: string | null;
  tier: string | null;
  source: string | null;
  partnerName: string | null;
  sourceNote: string | null;
  assigneeId: string | null;
  status: string | null;
  pipelineStage: string;
  trialStartDate: string | null;
  trialEndDate: string | null;
  payment: null;
  revenue: number | null;
  dealValue: number | null;
  productPackage: string | null;
  failureReason: string | null;
  failureNote: string | null;
  createdAt: string;
  syncedAt: string | null;
  lastContactedAt: string | null;
}

export interface PipelineDealRecordResponse {
  id: string;
  customer: PipelineCustomerReadModel;
  owner?: PipelineUserLite;
  relationship: PipelineRelationship;
  probability: number;
  value: number;
  openTaskCount: number;
  isClosing: boolean;
  isStuck: boolean;
  isActive: boolean;
  lastActivityAt: string;
  stageTransitionAt: string;
}

export interface CrmPipelineTableSummary {
  progressingDeals: number;
  stuckDeals: number;
  closingDeals: number;
  totalPipelineValue: number;
  wonValue: number;
  lostDeals: number;
  trialsExpiringSoon: number;
  totalCommission: number;
}

export interface GetCrmPipelineTableQueryFilters {
  search?: string;
  pipelineStage: string;
  status: string;
  productPackage: string;
  tier: string;
  source: string;
  assignee: string;
  focus: CrmPipelineTableFocus;
  isActive: CrmPipelineTableBooleanFilter;
  isClosing: CrmPipelineTableBooleanFilter;
  isStuck: CrmPipelineTableBooleanFilter;
  minValue?: number;
  maxValue?: number;
  minRevenue?: number;
  maxRevenue?: number;
  minGmv?: number;
  maxGmv?: number;
  minProbability?: number;
  maxProbability?: number;
  minOpenTaskCount?: number;
  maxOpenTaskCount?: number;
  createdFrom?: string;
  createdTo?: string;
  lastActivityFrom?: string;
  lastActivityTo?: string;
  lastContactedFrom?: string;
  lastContactedTo?: string;
  stageTransitionFrom?: string;
  stageTransitionTo?: string;
  trialEndFrom?: string;
  trialEndTo?: string;
  page: number;
  limit: number;
  sortKey: CrmPipelineTableSortKey;
  sortDirection: CrmPipelineTableSortDirection;
  currentUserId: number;
  currentUserRoleName?: string | null;
}

export interface GetCrmPipelineTableQueryResult {
  rows: PipelineDealRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
  summary: CrmPipelineTableSummary;
}

export class GetCrmPipelineTableQuery extends Query<GetCrmPipelineTableQueryResult> {
  constructor(public readonly filters: GetCrmPipelineTableQueryFilters) {
    super();
  }
}
