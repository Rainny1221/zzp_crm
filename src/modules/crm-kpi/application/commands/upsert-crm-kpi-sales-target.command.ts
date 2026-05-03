import { Command } from '@nestjs/cqrs';

export type UpsertCrmKpiSalesTargetParams = {
  salesRepId: number;
  periodType: 'monthly';
  periodStart: string;
  leadsTarget: number;
  qualifiedTarget: number;
  wonDealsTarget: number;
  pipelineValueTarget: number;
  wonValueTarget: number;
  actorUserId: number;
  actorRoleName?: string | null;
};

export type UpsertCrmKpiSalesTargetResult = {
  targetId: string;
  salesRepId: string;
  periodType: 'monthly';
  periodStart: string;
  periodEnd: string;
  leadsTarget: number;
  qualifiedTarget: number;
  wonDealsTarget: number;
  pipelineValueTarget: number;
  wonValueTarget: number;
  updatedAt: string;
};

export class UpsertCrmKpiSalesTargetCommand extends Command<UpsertCrmKpiSalesTargetResult> {
  constructor(public readonly params: UpsertCrmKpiSalesTargetParams) {
    super();
  }
}
