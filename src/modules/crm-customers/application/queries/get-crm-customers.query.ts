import { Query } from '@nestjs/cqrs';
import type {
  CrmCustomerFocusFilter,
  CrmCustomerStatusFilter,
  CrmCustomerTierFilter,
} from '../../presentation/dto/get-crm-customers.dto';

export type CustomerRelationship = 'lead' | 'trial' | 'paid' | 'lost';

export interface UserLite {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string | null;
}

export interface CustomerTaskLite {
  id: string;
  title: string;
  dueAt: string;
  priority: string | null;
}

export interface CustomerReadModel {
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
  pipelineStage: string | null;
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
  notes: [];
  profile: {
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
  };
  ownership: {
    assigneeId: string | null;
    owner: UserLite | null;
  };
  deal: {
    id: string | null;
    status: string | null;
    pipelineStage: string | null;
    productPackage: string | null;
    dealValue: number | null;
    revenue: number | null;
    probability: number | null;
    failureReason: string | null;
    failureNote: string | null;
  };
  timeline: {
    lastActivityAt: string | null;
    lastContactedAt: string | null;
    openTaskCount: number;
    nextTask: CustomerTaskLite | null;
  };
}

export interface CustomerRecordResponse {
  customer: CustomerReadModel;
  owner?: UserLite;
  relationship: CustomerRelationship;
  lastActivityAt: string | null;
  openTaskCount: number;
  nextTask: CustomerTaskLite | null;
  activeDealValue: number | null;
}

export interface GetCrmCustomersQueryFilters {
  search?: string;
  tier: CrmCustomerTierFilter;
  status: CrmCustomerStatusFilter;
  source: string;
  assignee: string;
  focus: CrmCustomerFocusFilter;
  page: number;
  limit: number;
  currentUserId: number;
  currentUserRoleName?: string | null;
}

export interface GetCrmCustomersQueryResult {
  items: CustomerRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
  summary: {
    filteredCount: number;
    totalCount: number;
  };
}

export class GetCrmCustomersQuery extends Query<GetCrmCustomersQueryResult> {
  constructor(public readonly filters: GetCrmCustomersQueryFilters) {
    super();
  }
}
