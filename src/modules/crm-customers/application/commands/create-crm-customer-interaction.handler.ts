import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_CUSTOMERS_LOG } from '../../domain/crm-customers.constants';
import { CrmCustomersWriteRepository } from '../../infrastructure/repositories/crm-customers-write.repository';
import {
  CreateCrmCustomerInteractionCommand,
  CreateCrmCustomerInteractionResult,
} from './create-crm-customer-interaction.command';

@CommandHandler(CreateCrmCustomerInteractionCommand)
export class CreateCrmCustomerInteractionHandler implements ICommandHandler<
  CreateCrmCustomerInteractionCommand,
  CreateCrmCustomerInteractionResult
> {
  constructor(
    private readonly repository: CrmCustomersWriteRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: CreateCrmCustomerInteractionCommand,
  ): Promise<CreateCrmCustomerInteractionResult> {
    const logMeta = {
      customerId: command.params.customerId,
      channel: command.params.channel,
      outcomeCode: command.params.outcomeCode,
      occurredAt: command.params.occurredAt ?? null,
      actorUserId: command.params.actorUserId,
      actorEmail: command.params.actorEmail ?? null,
      actorRoleName: command.params.actorRoleName ?? null,
      summaryLength: command.params.summary.trim().length,
    };

    this.logger.info({
      message: 'CRM customer interaction creation requested',
      context: CreateCrmCustomerInteractionHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_INTERACTION,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      entityId: command.params.customerId,
      meta: logMeta,
    });

    try {
      return await this.repository.createInteraction(command.params);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customer interaction creation failed',
        context: CreateCrmCustomerInteractionHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_INTERACTION,
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
        'Failed to create CRM customer interaction',
        {
          params: logMeta,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
