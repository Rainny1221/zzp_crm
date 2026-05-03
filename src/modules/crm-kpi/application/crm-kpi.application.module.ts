import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmKpiInfrastructureModule } from '../infrastructure/crm-kpi.infrastructure.module';
import { UpsertCrmKpiSalesTargetHandler } from './commands';
import {
  GetCrmKpiOverviewHandler,
  GetCrmKpiSalesHandler,
  GetCrmKpiSalesTargetHandler,
} from './queries';

@Module({
  imports: [CqrsModule, CrmKpiInfrastructureModule],
  providers: [
    GetCrmKpiOverviewHandler,
    GetCrmKpiSalesHandler,
    GetCrmKpiSalesTargetHandler,
    UpsertCrmKpiSalesTargetHandler,
  ],
})
export class CrmKpiApplicationModule {}
