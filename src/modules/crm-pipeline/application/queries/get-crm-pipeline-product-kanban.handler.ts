import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_PIPELINE_LOG } from '../../domain/crm-pipeline.constants';
import { CrmPipelineReadRepository } from '../../infrastructure/repositories/crm-pipeline-read.repository';
import { toPipelineDealRecordResponse } from '../mappers/crm-pipeline-table.mapper';
import {
  GetCrmPipelineProductKanbanQuery,
  GetCrmPipelineProductKanbanQueryResult,
  PipelineProductKanbanColumnResponse,
} from './get-crm-pipeline-product-kanban.query';

const DEFAULT_PRODUCT_PACKAGE_CODE = 'trial';

@QueryHandler(GetCrmPipelineProductKanbanQuery)
export class GetCrmPipelineProductKanbanHandler implements IQueryHandler<
  GetCrmPipelineProductKanbanQuery,
  GetCrmPipelineProductKanbanQueryResult
> {
  constructor(
    private readonly repository: CrmPipelineReadRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    query: GetCrmPipelineProductKanbanQuery,
  ): Promise<GetCrmPipelineProductKanbanQueryResult> {
    this.logger.info({
      message: 'CRM pipeline product kanban requested',
      context: GetCrmPipelineProductKanbanHandler.name,
      module: CRM_PIPELINE_LOG.MODULE,
      action: CRM_PIPELINE_LOG.ACTIONS.GET_PRODUCT_KANBAN,
      entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
      meta: {
        filters: query.filters,
      },
    });

    try {
      const result = await this.repository.findKanbanByProductPackage(
        query.filters,
      );
      const columns: Record<string, PipelineProductKanbanColumnResponse> = {};

      for (const productPackage of result.productPackages) {
        columns[productPackage.code] = {
          productPackage: productPackage.code,
          totalCount: 0,
          totalValue: 0,
          items: [],
        };
      }

      for (const row of result.rows) {
        const item = toPipelineDealRecordResponse(row);
        const key = row.productPackageCode ?? DEFAULT_PRODUCT_PACKAGE_CODE;

        columns[key] ??= {
          productPackage: key,
          totalCount: 0,
          totalValue: 0,
          items: [],
        };

        columns[key].items.push(item);
        columns[key].totalCount += 1;
        columns[key].totalValue += item.value;
      }

      return {
        columns,
        summary: result.summary,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM pipeline product kanban failed',
        context: GetCrmPipelineProductKanbanHandler.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_PRODUCT_KANBAN,
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
        'Failed to get CRM pipeline product kanban',
        {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
