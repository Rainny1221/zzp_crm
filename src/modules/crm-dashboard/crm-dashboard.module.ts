import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmDashboardApplicationModule } from './application/crm-dashboard.application.module';
import { CrmDashboardInfrastructureModule } from './infrastructure/crm-dashboard.infrastructure.module';
import { CrmDashboardController } from './presentation/crm-dashboard.controller';

@Module({
  imports: [
    CqrsModule,
    CrmDashboardInfrastructureModule,
    CrmDashboardApplicationModule,
  ],
  controllers: [CrmDashboardController],
  exports: [CrmDashboardApplicationModule, CrmDashboardInfrastructureModule],
})
export class CrmDashboardModule {}
