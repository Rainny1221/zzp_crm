import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_DASHBOARD_LOG } from '../../domain/crm-dashboard.constants';
import { CrmDashboardReadRepository } from '../../infrastructure/repositories/crm-dashboard-read.repository';
import {
  GetCrmDashboardAdminQuery,
  GetCrmDashboardAdminQueryResult,
} from './get-crm-dashboard-admin.query';

@QueryHandler(GetCrmDashboardAdminQuery)
export class GetCrmDashboardAdminHandler implements IQueryHandler<
  GetCrmDashboardAdminQuery,
  GetCrmDashboardAdminQueryResult
> {
  constructor(
    private readonly repository: CrmDashboardReadRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    query: GetCrmDashboardAdminQuery,
  ): Promise<GetCrmDashboardAdminQueryResult> {
    this.logger.info({
      message: 'CRM admin dashboard requested',
      context: GetCrmDashboardAdminHandler.name,
      module: CRM_DASHBOARD_LOG.MODULE,
      action: CRM_DASHBOARD_LOG.ACTIONS.GET_ADMIN,
      entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
      meta: {
        filters: query.filters,
      },
    });

    try {
      return await this.repository.getAdminDashboard(query.filters);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM admin dashboard failed',
        context: GetCrmDashboardAdminHandler.name,
        module: CRM_DASHBOARD_LOG.MODULE,
        action: CRM_DASHBOARD_LOG.ACTIONS.GET_ADMIN,
        entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
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
        'Failed to get CRM admin dashboard',
        {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
