import { Query } from '@nestjs/cqrs';
import type { CrmSyncJobResponse } from '../../presentation/crm-sync.presenter';

export type GetCrmSyncQueryResult = CrmSyncJobResponse;

export class GetCrmSyncQuery extends Query<GetCrmSyncQueryResult | null> {
  constructor(public readonly id: number) {
    super();
  }
}
