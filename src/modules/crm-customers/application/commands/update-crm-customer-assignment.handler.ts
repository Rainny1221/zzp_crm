import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_CUSTOMERS_LOG } from '../../domain/crm-customers.constants';
import { CrmCustomersWriteRepository } from '../../infrastructure/repositories/crm-customers-write.repository';
import {
  UpdateCrmCustomerAssignmentCommand,
  UpdateCrmCustomerAssignmentResult,
} from './update-crm-customer-assignment.command';

@CommandHandler(UpdateCrmCustomerAssignmentCommand)
export class UpdateCrmCustomerAssignmentHandler implements ICommandHandler<
  UpdateCrmCustomerAssignmentCommand,
  UpdateCrmCustomerAssignmentResult
> {
  constructor(
    private readonly repository: CrmCustomersWriteRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: UpdateCrmCustomerAssignmentCommand,
  ): Promise<UpdateCrmCustomerAssignmentResult> {
    this.logger.info({
      message: 'CRM customer assignment update requested',
      context: UpdateCrmCustomerAssignmentHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_ASSIGNMENT,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      entityId: command.params.customerId,
      meta: command.params,
    });

    try {
      return await this.repository.updateAssignment(command.params);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customer assignment update failed',
        context: UpdateCrmCustomerAssignmentHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_ASSIGNMENT,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        entityId: command.params.customerId,
        meta: {
          params: command.params,
          error: toErrorMeta(error),
        },
      });

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update CRM customer assignment',
        {
          params: command.params,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
