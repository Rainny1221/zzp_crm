import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CrmKpiReadRepository } from '../../infrastructure/repositories/crm-kpi-read.repository';
import { GetCrmKpiOverviewQuery } from './get-crm-kpi-overview.query';

@QueryHandler(GetCrmKpiOverviewQuery)
export class GetCrmKpiOverviewHandler implements IQueryHandler<
  GetCrmKpiOverviewQuery,
  any
> {
  constructor(private readonly repository: CrmKpiReadRepository) {}

  async execute(query: GetCrmKpiOverviewQuery) {
    return this.repository.getOverview(query.filters);
  }
}
