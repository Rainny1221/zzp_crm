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
  pipelineValue: number;
  wonValue: number;
  lostDeals: number;
  conversionRate: number;
}

export interface CrmDashboardPersonalPipelineResponse {
  rows: PipelineDealRecordResponse[];
  total: number;
}

export interface GetCrmDashboardSalesQueryResult {
  salesRep: CrmDashboardSalesRepResponse;
  kpiStrip: CrmDashboardSalesKpiStripResponse;
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
