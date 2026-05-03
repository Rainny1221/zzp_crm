import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmKpiInfrastructureModule } from '../infrastructure/crm-kpi.infrastructure.module';
import { GetCrmKpiOverviewHandler, GetCrmKpiSalesHandler } from './queries';

@Module({
  imports: [CqrsModule, CrmKpiInfrastructureModule],
  providers: [GetCrmKpiOverviewHandler, GetCrmKpiSalesHandler],
})
export class CrmKpiApplicationModule {}
