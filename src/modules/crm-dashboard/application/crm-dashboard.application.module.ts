import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmDashboardInfrastructureModule } from '../infrastructure/crm-dashboard.infrastructure.module';
import { GetCrmDashboardAdminHandler } from './queries';

const QueryHandlers = [GetCrmDashboardAdminHandler];

@Module({
  imports: [CqrsModule, CrmDashboardInfrastructureModule],
  providers: [...QueryHandlers],
})
export class CrmDashboardApplicationModule {}
