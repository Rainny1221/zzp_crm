import { Query } from '@nestjs/cqrs';

export interface GetCrmDashboardAdminQueryFilters {
  from?: string;
  to?: string;
  assignee: string;
  source: string;
  currentUserId: number;
  currentUserRoleName?: string | null;
}

export interface CrmDashboardKpiStripResponse {
  totalCustomers: number;
  activeDeals: number;
  pipelineValue: number;
  wonValue: number;
  lostDeals: number;
  conversionRate: number;
}

export interface CrmDashboardSalesPerformanceResponse {
  salesRepId: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string | null;
  openDeals: number;
  pipelineValue: number;
  wonValue: number;
  lostDeals: number;
  conversionRate: number;
}

export interface CrmDashboardTeamPerformanceResponse {
  teamId: string | null;
  teamName: string;
  openDeals: number;
  pipelineValue: number;
  wonValue: number;
}

export interface CrmDashboardLeadDistributionResponse {
  stage: string;
  count: number;
  value: number;
}

export interface CrmDashboardLeadSourceResponse {
  source: string;
  count: number;
  value: number;
}

export interface CrmDashboardFailureAnalysisResponse {
  failureReason: string;
  label: string | null;
  count: number;
}

export interface CrmDashboardQuickActionsResponse {
  unassignedLeads: number;
  stuckDeals: number;
  closingDeals: number;
  trialsExpiringSoon: number;
}

export interface GetCrmDashboardAdminQueryResult {
  kpiStrip: CrmDashboardKpiStripResponse;
  salesPerformance: CrmDashboardSalesPerformanceResponse[];
  teamPerformance: CrmDashboardTeamPerformanceResponse[];
  leadDistribution: CrmDashboardLeadDistributionResponse[];
  leadSources: CrmDashboardLeadSourceResponse[];
  failureAnalysis: CrmDashboardFailureAnalysisResponse[];
  quickActions: CrmDashboardQuickActionsResponse;
}

export class GetCrmDashboardAdminQuery extends Query<GetCrmDashboardAdminQueryResult> {
  constructor(public readonly filters: GetCrmDashboardAdminQueryFilters) {
    super();
  }
}
