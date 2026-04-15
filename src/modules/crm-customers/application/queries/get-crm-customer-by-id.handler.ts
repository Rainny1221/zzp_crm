import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CrmCustomersReadRepository } from '../../infrastructure/repositories/crm-customers-read.repository';
import { toCustomerDetailResponse } from '../mappers/crm-customer-read-model.mapper';
import {
  CustomerDetailResponse,
  GetCrmCustomerByIdQuery,
} from './get-crm-customer-by-id.query';

const CRM_CUSTOMERS_LOG = {
  MODULE: 'crm-customers',
  ACTIONS: {
    GET_CUSTOMER_DETAIL: 'CRM_CUSTOMERS_GET_DETAIL',
  },
  ENTITIES: {
    CUSTOMER: 'CRM_CUSTOMER',
  },
} as const;

@QueryHandler(GetCrmCustomerByIdQuery)
export class GetCrmCustomerByIdHandler implements IQueryHandler<
  GetCrmCustomerByIdQuery,
  CustomerDetailResponse
> {
  constructor(
    private readonly repository: CrmCustomersReadRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    query: GetCrmCustomerByIdQuery,
  ): Promise<CustomerDetailResponse> {
    this.logger.info({
      message: 'CRM customer detail requested',
      context: GetCrmCustomerByIdHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.GET_CUSTOMER_DETAIL,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      entityId: query.params.customerId,
      meta: query.params,
    });

    try {
      const detail = await this.repository.findCustomerById(query.params);

      if (!detail) {
        throw ErrorFactory.create(
          ErrorCode.ITEM_NOT_FOUND,
          'CRM customer not found',
          { customerId: query.params.customerId },
        );
      }

      return toCustomerDetailResponse(detail);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customer detail failed',
        context: GetCrmCustomerByIdHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.GET_CUSTOMER_DETAIL,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        entityId: query.params.customerId,
        meta: {
          params: query.params,
          error: toErrorMeta(error),
        },
      });

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get CRM customer detail',
        {
          params: query.params,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
