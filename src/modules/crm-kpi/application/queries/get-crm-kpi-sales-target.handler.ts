import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { CrmKpiReadRepository } from '../../infrastructure/repositories/crm-kpi-read.repository';
import { GetCrmKpiSalesTargetQuery } from './get-crm-kpi-sales-target.query';

@QueryHandler(GetCrmKpiSalesTargetQuery)
export class GetCrmKpiSalesTargetHandler implements IQueryHandler<
  GetCrmKpiSalesTargetQuery,
  any
> {
  constructor(private readonly repository: CrmKpiReadRepository) {}

  async execute(query: GetCrmKpiSalesTargetQuery) {
    const canViewOtherSalesKpi =
      query.filters.currentUserRoleName === 'ADMIN' ||
      query.filters.currentUserRoleName === 'SALE_MANAGER';

    if (
      !canViewOtherSalesKpi &&
      query.filters.currentUserId !== query.filters.salesRepId
    ) {
      throw ErrorFactory.create(
        ErrorCode.FORBIDDEN_ACCESS,
        'You do not have permission to view this sales KPI target',
        {
          salesRepId: query.filters.salesRepId,
          currentUserId: query.filters.currentUserId,
        },
      );
    }

    return this.repository.getSalesTarget(query.filters);
  }
}
