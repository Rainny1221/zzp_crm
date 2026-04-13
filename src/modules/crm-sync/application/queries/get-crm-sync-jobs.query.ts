import { Query } from '@nestjs/cqrs';
import type { CrmSyncJobStatus } from '../../domain/crm-sync.constants';
import type { CrmSyncJobResponse } from '../../presentation/crm-sync.presenter';

export interface GetCrmSyncJobsFilters {
  status?: CrmSyncJobStatus;
  eventType?: string;
  page: number;
  limit: number;
}

export interface GetCrmSyncJobsQueryResult {
  items: CrmSyncJobResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export class GetCrmSyncJobsQuery extends Query<GetCrmSyncJobsQueryResult> {
  constructor(public readonly filters: GetCrmSyncJobsFilters) {
    super();
  }
}
