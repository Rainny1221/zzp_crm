import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
import { I_CRM_SYNC_REPOSITORY } from '../../domain/repositories/i-crm-sync.repository';
import { CrmSyncPresenter } from '../../presentation/crm-sync.presenter';
import { GetCrmSyncQuery, GetCrmSyncQueryResult } from './get-crm-sync.query';

@QueryHandler(GetCrmSyncQuery)
export class GetCrmSyncHandler implements IQueryHandler<GetCrmSyncQuery> {
  private readonly repo: ICrmSyncRepository;

  constructor(
    @Inject(I_CRM_SYNC_REPOSITORY)
    repo: ICrmSyncRepository,
  ) {
    this.repo = repo;
  }

  async execute(query: GetCrmSyncQuery): Promise<GetCrmSyncQueryResult | null> {
    const entity = await this.repo.findById(query.id);
    if (!entity) return null;

    return CrmSyncPresenter.toResponse(entity);
  }
}
