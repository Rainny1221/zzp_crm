import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import type {
  UpsertCrmKpiSalesTargetParams,
  UpsertCrmKpiSalesTargetResult,
} from '../../application/commands';

@Injectable()
export class CrmKpiWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSalesTarget(
    params: UpsertCrmKpiSalesTargetParams,
  ): Promise<UpsertCrmKpiSalesTargetResult> {
    const owner = await this.prisma.user.findUnique({
      where: { id: params.salesRepId },
      select: { id: true },
    });

    if (!owner) {
      throw ErrorFactory.create(
        ErrorCode.ITEM_NOT_FOUND,
        'Sales rep not found',
        {
          salesRepId: params.salesRepId,
        },
      );
    }

    const periodStart = this.toPeriodStart(params.periodStart);
    const periodEnd = this.getMonthlyPeriodEnd(periodStart);

    const target = await this.prisma.crmKpiTargets.upsert({
      where: {
        scope_type_owner_user_id_period_start: {
          scope_type: 'sales',
          owner_user_id: params.salesRepId,
          period_start: periodStart,
        },
      },
      update: {
        period_type: params.periodType,
        period_end: periodEnd,
        leads_target: params.leadsTarget,
        qualified_target: params.qualifiedTarget,
        won_deals_target: params.wonDealsTarget,
        pipeline_value_target: params.pipelineValueTarget,
        won_value_target: params.wonValueTarget,
        updated_at: new Date(),
      },
      create: {
        scope_type: 'sales',
        owner_user_id: params.salesRepId,
        period_type: params.periodType,
        period_start: periodStart,
        period_end: periodEnd,
        leads_target: params.leadsTarget,
        qualified_target: params.qualifiedTarget,
        won_deals_target: params.wonDealsTarget,
        pipeline_value_target: params.pipelineValueTarget,
        won_value_target: params.wonValueTarget,
        created_by: params.actorUserId,
      },
    });

    return {
      targetId: String(target.id),
      salesRepId: String(params.salesRepId),
      periodType: target.period_type as 'monthly',
      periodStart: this.toDateOnly(target.period_start),
      periodEnd: this.toDateOnly(target.period_end),
      leadsTarget: target.leads_target,
      qualifiedTarget: target.qualified_target,
      wonDealsTarget: target.won_deals_target,
      pipelineValueTarget: Number(target.pipeline_value_target),
      wonValueTarget: Number(target.won_value_target),
      updatedAt: target.updated_at.toISOString(),
    };
  }

  private toPeriodStart(periodStart: string): Date {
    return new Date(`${periodStart.slice(0, 10)}T00:00:00.000Z`);
  }

  private getMonthlyPeriodEnd(periodStart: Date): Date {
    const end = new Date(periodStart);
    end.setUTCMonth(end.getUTCMonth() + 1);
    end.setUTCDate(0);
    return end;
  }

  private toDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
