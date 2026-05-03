import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { CrmKpiWriteRepository } from '../../infrastructure/repositories/crm-kpi-write.repository';
import {
  UpsertCrmKpiSalesTargetCommand,
  UpsertCrmKpiSalesTargetResult,
} from './upsert-crm-kpi-sales-target.command';

@CommandHandler(UpsertCrmKpiSalesTargetCommand)
export class UpsertCrmKpiSalesTargetHandler implements ICommandHandler<
  UpsertCrmKpiSalesTargetCommand,
  UpsertCrmKpiSalesTargetResult
> {
  constructor(private readonly repository: CrmKpiWriteRepository) {}

  async execute(
    command: UpsertCrmKpiSalesTargetCommand,
  ): Promise<UpsertCrmKpiSalesTargetResult> {
    const canManageTargets =
      command.params.actorRoleName === 'ADMIN' ||
      command.params.actorRoleName === 'SALE_MANAGER';

    if (!canManageTargets) {
      throw ErrorFactory.create(
        ErrorCode.FORBIDDEN_ACCESS,
        'You do not have permission to manage CRM KPI targets',
        {
          actorUserId: command.params.actorUserId,
          actorRoleName: command.params.actorRoleName,
        },
      );
    }

    return this.repository.upsertSalesTarget(command.params);
  }
}
