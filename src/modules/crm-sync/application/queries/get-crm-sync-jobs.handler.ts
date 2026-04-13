import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_SYNC_LOG } from '../../domain/crm-sync.constants';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
import { I_CRM_SYNC_REPOSITORY } from '../../domain/repositories/i-crm-sync.repository';
import { CrmSyncPresenter } from '../../presentation/crm-sync.presenter';
import {
  GetCrmSyncJobsQuery,
  GetCrmSyncJobsQueryResult,
} from './get-crm-sync-jobs.query';

@QueryHandler(GetCrmSyncJobsQuery)
export class GetCrmSyncJobsHandler implements IQueryHandler<
  GetCrmSyncJobsQuery,
  GetCrmSyncJobsQueryResult
> {
  constructor(
    @Inject(I_CRM_SYNC_REPOSITORY)
    private readonly syncRepo: ICrmSyncRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    query: GetCrmSyncJobsQuery,
  ): Promise<GetCrmSyncJobsQueryResult> {
    this.logger.info({
      message: 'CRM sync jobs list requested',
      context: GetCrmSyncJobsHandler.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.LIST_JOBS,
      entityType: CRM_SYNC_LOG.ENTITIES.JOB,
      meta: {
        filters: query.filters,
      },
    });

    try {
      const result = await this.syncRepo.findMany(query.filters);
      const pageCount = Math.ceil(result.total / query.filters.limit);

      return {
        items: result.items.map((item) => CrmSyncPresenter.toResponse(item)),
        pagination: {
          page: query.filters.page,
          limit: query.filters.limit,
          total: result.total,
          pageCount,
        },
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM sync jobs list failed',
        context: GetCrmSyncJobsHandler.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.LIST_JOBS,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        meta: {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      });

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to list CRM sync jobs',
        {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
