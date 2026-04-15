import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_CUSTOMERS_LOG } from '../../domain/crm-customers.constants';
import { CrmCustomersWriteRepository } from '../../infrastructure/repositories/crm-customers-write.repository';
import {
  CreateCrmCustomerNoteCommand,
  CreateCrmCustomerNoteResult,
} from './create-crm-customer-note.command';

@CommandHandler(CreateCrmCustomerNoteCommand)
export class CreateCrmCustomerNoteHandler implements ICommandHandler<
  CreateCrmCustomerNoteCommand,
  CreateCrmCustomerNoteResult
> {
  constructor(
    private readonly repository: CrmCustomersWriteRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: CreateCrmCustomerNoteCommand,
  ): Promise<CreateCrmCustomerNoteResult> {
    const logMeta = {
      customerId: command.params.customerId,
      actorUserId: command.params.actorUserId,
      actorEmail: command.params.actorEmail ?? null,
      actorRoleName: command.params.actorRoleName ?? null,
      contentLength: command.params.content.trim().length,
    };

    this.logger.info({
      message: 'CRM customer note creation requested',
      context: CreateCrmCustomerNoteHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_NOTE,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      entityId: command.params.customerId,
      meta: logMeta,
    });

    try {
      return await this.repository.createNote(command.params);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customer note creation failed',
        context: CreateCrmCustomerNoteHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.CREATE_NOTE,
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
        'Failed to create CRM customer note',
        {
          params: command.params,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
