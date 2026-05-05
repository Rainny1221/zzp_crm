import { Query } from '@nestjs/cqrs';
import type { PipelineDealRecordResponse } from 'src/modules/crm-pipeline/application/queries';
import type {
  CrmDashboardFailureAnalysisResponse,
  CrmDashboardLeadDistributionResponse,
  CrmDashboardLeadSourceResponse,
  CrmDashboardQuickActionsResponse,
} from './get-crm-dashboard-admin.query';

export interface GetCrmDashboardSalesQueryFilters {
  salesRepId: number;
  from?: string;
  to?: string;
  source: string;
  currentUserId: number;
  currentUserRoleName?: string | null;
}

export interface CrmDashboardSalesRepResponse {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string | null;
}

export interface CrmDashboardSalesKpiStripResponse {
  assignedCustomers: number;
  activeDeals: number;
  qualifiedLeads: number;
  wonDeals: number;
  pipelineValue: number;
  wonValue: number;
  lostDeals: number;
  monthlyClosedDeals: number;
  averageOrderValue: number;
  conversionRate: number;
}

export type CrmDashboardSalesTargetsResponse = {
  wonValueTarget: number;
  wonDealsTarget: number;
  qualifiedTarget: number;
  pipelineValueTarget: number;
} | null;

export type CrmDashboardSalesAttainmentResponse = {
  wonValuePct: number;
  wonDealsPct: number;
  qualifiedPct: number;
  pipelineValuePct: number;
} | null;

export interface CrmDashboardPersonalPipelineResponse {
  rows: PipelineDealRecordResponse[];
  total: number;
}

export interface GetCrmDashboardSalesQueryResult {
  salesRep: CrmDashboardSalesRepResponse;
  period: {
    from: string;
    to: string;
  };
  kpiStrip: CrmDashboardSalesKpiStripResponse;
  targets: CrmDashboardSalesTargetsResponse;
  quota: number;
  targetProgress: number;
  attainment: CrmDashboardSalesAttainmentResponse;
  leadDistribution: CrmDashboardLeadDistributionResponse[];
  leadSources: CrmDashboardLeadSourceResponse[];
  failureAnalysis: CrmDashboardFailureAnalysisResponse[];
  quickActions: CrmDashboardQuickActionsResponse;
  personalPipeline: CrmDashboardPersonalPipelineResponse;
}

export class GetCrmDashboardSalesQuery extends Query<GetCrmDashboardSalesQueryResult> {
  constructor(public readonly filters: GetCrmDashboardSalesQueryFilters) {
    super();
  }
}
