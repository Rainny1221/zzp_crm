import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CrmPipelineReadRepository } from '../../infrastructure/repositories/crm-pipeline-read.repository';
import { CRM_PIPELINE_LOG } from '../../domain/crm-pipeline.constants';
import { toPipelineDealRecordResponse } from '../mappers/crm-pipeline-table.mapper';
import {
  GetCrmPipelineTableQuery,
  GetCrmPipelineTableQueryResult,
} from './get-crm-pipeline-table.query';

@QueryHandler(GetCrmPipelineTableQuery)
export class GetCrmPipelineTableHandler implements IQueryHandler<
  GetCrmPipelineTableQuery,
  GetCrmPipelineTableQueryResult
> {
  constructor(
    private readonly repository: CrmPipelineReadRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    query: GetCrmPipelineTableQuery,
  ): Promise<GetCrmPipelineTableQueryResult> {
    this.logger.info({
      message: 'CRM pipeline table requested',
      context: GetCrmPipelineTableHandler.name,
      module: CRM_PIPELINE_LOG.MODULE,
      action: CRM_PIPELINE_LOG.ACTIONS.GET_TABLE,
      entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
      meta: {
        filters: query.filters,
      },
    });

    try {
      const result = await this.repository.findTable(query.filters);
      const pageCount = Math.ceil(result.total / query.filters.limit);

      return {
        rows: result.rows.map((row) => toPipelineDealRecordResponse(row)),
        pagination: {
          page: query.filters.page,
          limit: query.filters.limit,
          total: result.total,
          pageCount,
        },
        summary: result.summary,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM pipeline table failed',
        context: GetCrmPipelineTableHandler.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_TABLE,
        entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
        meta: {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      });

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get CRM pipeline table',
        {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
