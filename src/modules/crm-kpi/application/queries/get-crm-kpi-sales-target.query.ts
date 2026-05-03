import { Query } from '@nestjs/cqrs';

export type GetCrmKpiSalesTargetFilters = {
  salesRepId: number;
  periodType: 'monthly';
  periodStart: string;
  currentUserId: number;
  currentUserRoleName?: string | null;
};

export class GetCrmKpiSalesTargetQuery extends Query<any> {
  constructor(public readonly filters: GetCrmKpiSalesTargetFilters) {
    super();
  }
}
