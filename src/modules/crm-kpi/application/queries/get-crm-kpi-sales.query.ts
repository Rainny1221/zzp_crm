import { Query } from '@nestjs/cqrs';

export type GetCrmKpiSalesFilters = {
  salesRepId: number;
  from?: string;
  to?: string;
  source: string;
  currentUserId: number;
  currentUserRoleName?: string | null;
};

export class GetCrmKpiSalesQuery extends Query<any> {
  constructor(public readonly filters: GetCrmKpiSalesFilters) {
    super();
  }
}
