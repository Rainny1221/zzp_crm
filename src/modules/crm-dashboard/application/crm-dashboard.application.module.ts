import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmDashboardInfrastructureModule } from '../infrastructure/crm-dashboard.infrastructure.module';
import {
  GetCrmDashboardAdminHandler,
  GetCrmDashboardSalesHandler,
} from './queries';

const QueryHandlers = [
  GetCrmDashboardAdminHandler,
  GetCrmDashboardSalesHandler,
];

@Module({
  imports: [CqrsModule, CrmDashboardInfrastructureModule],
  providers: [...QueryHandlers],
})
export class CrmDashboardApplicationModule {}
