import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_CUSTOMERS_LOG } from '../../domain/crm-customers.constants';
import { CrmCustomersWriteRepository } from '../../infrastructure/repositories/crm-customers-write.repository';
import {
  CreateCrmCustomerCommand,
  CreateCrmCustomerResult,
} from './create-crm-customer.command';

@CommandHandler(CreateCrmCustomerCommand)
export class CreateCrmCustomerHandler implements ICommandHandler<
  CreateCrmCustomerCommand,
  CreateCrmCustomerResult
> {
  constructor(
    private readonly repository: CrmCustomersWriteRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: CreateCrmCustomerCommand,
  ): Promise<CreateCrmCustomerResult> {
    this.logger.info({
      message: 'CRM customer create requested',
      context: CreateCrmCustomerHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_CUSTOMER,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      meta: {
        params: {
          source: command.params.source,
          assigneeId: command.params.assigneeId ?? null,
          productPackage: command.params.productPackage,
          dealValue: command.params.dealValue ?? null,
          actorUserId: command.params.actorUserId,
          actorEmail: command.params.actorEmail ?? null,
          actorRoleName: command.params.actorRoleName ?? null,
          hasPhone: Boolean(command.params.phone),
          hasEmail: Boolean(command.params.email),
          hasTiktokLink: Boolean(command.params.tiktokLink),
        },
      },
    });

    try {
      return await this.repository.createCustomer(command.params);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customer create failed',
        context: CreateCrmCustomerHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_CUSTOMER,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        meta: {
          params: {
            source: command.params.source,
            assigneeId: command.params.assigneeId ?? null,
            productPackage: command.params.productPackage,
            actorUserId: command.params.actorUserId,
            actorEmail: command.params.actorEmail ?? null,
            actorRoleName: command.params.actorRoleName ?? null,
          },
          error: toErrorMeta(error),
        },
      });

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to create CRM customer',
        {
          params: command.params,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
