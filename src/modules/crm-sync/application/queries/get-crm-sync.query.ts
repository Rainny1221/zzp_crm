import { Query } from '@nestjs/cqrs';

export interface GetCrmSyncQueryResult {
  id: number;
}

export class GetCrmSyncQuery extends Query<GetCrmSyncQueryResult | null> {
  constructor(public readonly id: number) {
    super();
  }
}
