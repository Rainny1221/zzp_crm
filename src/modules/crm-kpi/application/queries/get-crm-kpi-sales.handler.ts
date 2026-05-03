import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { CrmKpiReadRepository } from '../../infrastructure/repositories/crm-kpi-read.repository';
import { GetCrmKpiSalesQuery } from './get-crm-kpi-sales.query';

@QueryHandler(GetCrmKpiSalesQuery)
export class GetCrmKpiSalesHandler implements IQueryHandler<
  GetCrmKpiSalesQuery,
  any
> {
  constructor(private readonly repository: CrmKpiReadRepository) {}

  async execute(query: GetCrmKpiSalesQuery) {
    const canViewOtherSalesKpi =
      query.filters.currentUserRoleName === 'ADMIN' ||
      query.filters.currentUserRoleName === 'SALE_MANAGER';

    if (
      !canViewOtherSalesKpi &&
      query.filters.currentUserId !== query.filters.salesRepId
    ) {
      throw ErrorFactory.create(
        ErrorCode.FORBIDDEN_ACCESS,
        'You do not have permission to view this sales KPI',
        {
          salesRepId: query.filters.salesRepId,
          currentUserId: query.filters.currentUserId,
        },
      );
    }

    return this.repository.getSalesKpi(query.filters);
  }
}
