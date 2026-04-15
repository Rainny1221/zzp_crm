import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_CUSTOMERS_LOG } from '../../domain/crm-customers.constants';
import { CrmCustomersWriteRepository } from '../../infrastructure/repositories/crm-customers-write.repository';
import {
  UpdateCrmCustomerProductPackageCommand,
  UpdateCrmCustomerProductPackageResult,
} from './update-crm-customer-product-package.command';

@CommandHandler(UpdateCrmCustomerProductPackageCommand)
export class UpdateCrmCustomerProductPackageHandler implements ICommandHandler<
  UpdateCrmCustomerProductPackageCommand,
  UpdateCrmCustomerProductPackageResult
> {
  constructor(
    private readonly repository: CrmCustomersWriteRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: UpdateCrmCustomerProductPackageCommand,
  ): Promise<UpdateCrmCustomerProductPackageResult> {
    const logMeta = {
      customerId: command.params.customerId,
      productPackage: command.params.productPackage,
      dealValue: command.params.dealValue ?? null,
      actorUserId: command.params.actorUserId,
      actorEmail: command.params.actorEmail ?? null,
      actorRoleName: command.params.actorRoleName ?? null,
      noteLength: command.params.note?.trim().length ?? 0,
    };

    this.logger.info({
      message: 'CRM customer product package update requested',
      context: UpdateCrmCustomerProductPackageHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_PRODUCT_PACKAGE,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      entityId: command.params.customerId,
      meta: logMeta,
    });

    try {
      return await this.repository.updateProductPackage(command.params);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customer product package update failed',
        context: UpdateCrmCustomerProductPackageHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_PRODUCT_PACKAGE,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        entityId: command.params.customerId,
        meta: {
          params: logMeta,
          error: toErrorMeta(error),
        },
      });

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update CRM customer product package',
        {
          params: logMeta,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
