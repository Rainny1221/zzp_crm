import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_CUSTOMERS_LOG } from '../../domain/crm-customers.constants';
import { CrmCustomersWriteRepository } from '../../infrastructure/repositories/crm-customers-write.repository';
import {
  UpdateCrmCustomerPipelineStageCommand,
  UpdateCrmCustomerPipelineStageResult,
} from './update-crm-customer-pipeline-stage.command';

@CommandHandler(UpdateCrmCustomerPipelineStageCommand)
export class UpdateCrmCustomerPipelineStageHandler implements ICommandHandler<
  UpdateCrmCustomerPipelineStageCommand,
  UpdateCrmCustomerPipelineStageResult
> {
  constructor(
    private readonly repository: CrmCustomersWriteRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: UpdateCrmCustomerPipelineStageCommand,
  ): Promise<UpdateCrmCustomerPipelineStageResult> {
    const logMeta = {
      customerId: command.params.customerId,
      pipelineStage: command.params.pipelineStage,
      failureReason: command.params.failureReason ?? null,
      actorUserId: command.params.actorUserId,
      actorEmail: command.params.actorEmail ?? null,
      actorRoleName: command.params.actorRoleName ?? null,
      noteLength: command.params.note?.trim().length ?? 0,
      failureNoteLength: command.params.failureNote?.trim().length ?? 0,
    };

    this.logger.info({
      message: 'CRM customer pipeline stage update requested',
      context: UpdateCrmCustomerPipelineStageHandler.name,
      module: CRM_CUSTOMERS_LOG.MODULE,
      action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_PIPELINE_STAGE,
      entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
      entityId: command.params.customerId,
      meta: logMeta,
    });

    try {
      return await this.repository.updatePipelineStage(command.params);
    } catch (error: unknown) {
      this.logger.error({
        message: 'CRM customer pipeline stage update failed',
        context: UpdateCrmCustomerPipelineStageHandler.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.UPDATE_PIPELINE_STAGE,
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
        'Failed to update CRM customer pipeline stage',
        {
          params: logMeta,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
