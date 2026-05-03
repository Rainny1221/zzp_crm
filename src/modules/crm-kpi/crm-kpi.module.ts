import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmKpiApplicationModule } from './application/crm-kpi.application.module';
import { CrmKpiInfrastructureModule } from './infrastructure/crm-kpi.infrastructure.module';
import { CrmKpiController } from './presentation/crm-kpi.controller';

@Module({
  imports: [CqrsModule, CrmKpiApplicationModule, CrmKpiInfrastructureModule],
  controllers: [CrmKpiController],
  exports: [CrmKpiApplicationModule, CrmKpiInfrastructureModule],
})
export class CrmKpiModule {}
