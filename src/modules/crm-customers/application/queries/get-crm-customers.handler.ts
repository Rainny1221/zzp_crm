import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CrmCustomersReadRepository } from '../../infrastructure/repositories/crm-customers-read.repository';
import { toCustomerRecordResponse } from '../mappers/crm-customer-read-model.mapper';
import {
  GetCrmCustomersQuery,
  GetCrmCustomersQueryResult,
} from './get-crm-customers.query';

const CRM_CUSTOMERS_LOG = {
  MODULE: 'crm-customers',
  ACTIONS: {
    LIST_CUSTOMERS: 'CRM_CUSTOMERS_LIST',
  },
  ENTITIES: {
    CUSTOMER: 'CRM_CUSTOMER',
  },
} as const;

@QueryHandler(GetCrmCustomersQuery)
export class GetCrmCustomersHandler implements IQueryHandler<
  GetCrmCustomersQuery,
  GetCrmCustomersQueryResult
> {
  constructor(
    private readonly repository: CrmCustomersReadRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    query: GetCrmCustomersQuery,
  ): Promise<GetCrmCustomersQueryResult> {
    this.logger.info({
      message: 'CRM customers list requested',
      context: GetCrmCustomersHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.LIST_CUSTOMERS,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      meta: {
        filters: query.filters,
      },
    });

    try {
      const result = await this.repository.findCustomers(query.filters);
      const pageCount = Math.ceil(result.filteredCount / query.filters.limit);

      return {
        items: result.items.map((item) => toCustomerRecordResponse(item)),
        pagination: {
          page: query.filters.page,
          limit: query.filters.limit,
          total: result.filteredCount,
          pageCount,
        },
        summary: {
          filteredCount: result.filteredCount,
          totalCount: result.totalCount,
        },
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customers list failed',
        context: GetCrmCustomersHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.LIST_CUSTOMERS,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
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
        'Failed to list CRM customers',
        {
          filters: query.filters,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
