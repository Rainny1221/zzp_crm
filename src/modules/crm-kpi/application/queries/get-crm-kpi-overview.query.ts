import { Query } from '@nestjs/cqrs';

export type GetCrmKpiOverviewFilters = {
  from?: string;
  to?: string;
  source: string;
  assignee: string;
  stage: string;
  productPackage: string;
  currentUserId: number;
  currentUserRoleName?: string | null;
};

export class GetCrmKpiOverviewQuery extends Query<any> {
  constructor(public readonly filters: GetCrmKpiOverviewFilters) {
    super();
  }
}
