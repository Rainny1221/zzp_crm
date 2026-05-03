import { Query } from '@nestjs/cqrs';

export interface GetCrmDashboardAdminQueryFilters {
  from?: string;
  to?: string;
  assignee: string;
  source: string;
  granularity: CrmDashboardSalesPerformanceGranularity;
  currentUserId: number;
  currentUserRoleName?: string | null;
}

export interface CrmDashboardKpiStripResponse {
  totalCustomers: number;
  activeDeals: number;
  activeTrialCount: number;
  pipelineValue: number;
  wonValue: number;
  lostDeals: number;
  averageOrderValue: number;
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

export type CrmDashboardSalesPerformanceGranularity =
  | 'daily'
  | 'weekly'
  | 'monthly';

export interface CrmDashboardSalesPerformanceSeriesPointResponse {
  bucket: string;
  revenue: number;
  wonDeals: number;
}

export interface CrmDashboardSalesPerformanceSeriesResponse {
  granularity: CrmDashboardSalesPerformanceGranularity;
  points: CrmDashboardSalesPerformanceSeriesPointResponse[];
}

export interface CrmDashboardTeamPerformanceResponse {
  teamId: string | null;
  teamName: string;
  openDeals: number;
  pipelineValue: number;
  wonValue: number;
  paidCustomers: number;
  wonDeals: number;
  managedCustomers: number;
  totalCustomers: number;
  commission: number;
  averageOrderValue: number;
  quota: number;
  target: number;
}

export interface CrmDashboardLeadDistributionResponse {
  stage: string;
  count: number;
  value: number;
}

export interface CrmDashboardStatusPanelItemResponse {
  status: 'new' | 'trial' | 'failed' | 'success';
  count: number;
}

export interface CrmDashboardLeadSourceResponse {
  source: string;
  count: number;
  converted: number;
  conversionRate: number;
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
  salesPerformanceSeries: CrmDashboardSalesPerformanceSeriesResponse;
  teamPerformance: CrmDashboardTeamPerformanceResponse[];
  leadDistribution: CrmDashboardLeadDistributionResponse[];
  statusPanel: CrmDashboardStatusPanelItemResponse[];
  leadSources: CrmDashboardLeadSourceResponse[];
  failureAnalysis: CrmDashboardFailureAnalysisResponse[];
  quickActions: CrmDashboardQuickActionsResponse;
}

export class GetCrmDashboardAdminQuery extends Query<GetCrmDashboardAdminQueryResult> {
  constructor(public readonly filters: GetCrmDashboardAdminQueryFilters) {
    super();
  }
}
