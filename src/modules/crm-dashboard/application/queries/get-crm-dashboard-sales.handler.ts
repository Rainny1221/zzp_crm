import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { toPipelineDealRecordResponse } from 'src/modules/crm-pipeline/application/mappers/crm-pipeline-table.mapper';
import { CRM_DASHBOARD_LOG } from '../../domain/crm-dashboard.constants';
import { CrmDashboardReadRepository } from '../../infrastructure/repositories/crm-dashboard-read.repository';
import {
  GetCrmDashboardSalesQuery,
  GetCrmDashboardSalesQueryResult,
} from './get-crm-dashboard-sales.query';

const SALES_DASHBOARD_MANAGER_ROLES = new Set(['ADMIN', 'SALE_MANAGER']);

@QueryHandler(GetCrmDashboardSalesQuery)
export class GetCrmDashboardSalesHandler implements IQueryHandler<
  GetCrmDashboardSalesQuery,
  GetCrmDashboardSalesQueryResult
> {
  constructor(
    private readonly repository: CrmDashboardReadRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    query: GetCrmDashboardSalesQuery,
  ): Promise<GetCrmDashboardSalesQueryResult> {
    this.logger.info({
      message: 'CRM sales dashboard requested',
      context: GetCrmDashboardSalesHandler.name,
      module: CRM_DASHBOARD_LOG.MODULE,
      action: CRM_DASHBOARD_LOG.ACTIONS.GET_SALES,
      entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
      entityId: query.filters.salesRepId,
      meta: {
        filters: query.filters,
      },
    });

    try {
      this.assertScope(query.filters);

      const result = await this.repository.getSalesDashboard(query.filters);

      return {
        salesRep: result.salesRep,
        kpiStrip: result.kpiStrip,
        leadDistribution: result.leadDistribution,
        leadSources: result.leadSources,
        failureAnalysis: result.failureAnalysis,
        quickActions: result.quickActions,
        personalPipeline: {
          rows: result.personalPipelineRows.map((row) =>
            toPipelineDealRecordResponse(row),
          ),
          total: result.personalPipelineTotal,
        },
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM sales dashboard failed',
        context: GetCrmDashboardSalesHandler.name,
        module: CRM_DASHBOARD_LOG.MODULE,
        action: CRM_DASHBOARD_LOG.ACTIONS.GET_SALES,
        entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
        entityId: query.filters.salesRepId,
        meta: {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      });

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get CRM sales dashboard',
        {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      );
    }
  }

  private assertScope(filters: GetCrmDashboardSalesQuery['filters']): void {
    const currentRole = filters.currentUserRoleName?.toUpperCase() ?? null;
    const canViewOtherSalesDashboard =
      currentRole !== null && SALES_DASHBOARD_MANAGER_ROLES.has(currentRole);

    if (
      canViewOtherSalesDashboard ||
      filters.currentUserId === filters.salesRepId
    ) {
      return;
    }

    throw ErrorFactory.create(
      ErrorCode.FORBIDDEN_ACCESS,
      'You do not have permission to view this sales dashboard',
      {
        salesRepId: filters.salesRepId,
        currentUserId: filters.currentUserId,
        currentUserRoleName: filters.currentUserRoleName ?? null,
      },
    );
  }
}
