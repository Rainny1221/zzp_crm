import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmCustomersInfrastructureModule } from '../infrastructure/crm-customers.infrastructure.module';
import { GetCrmCustomersHandler } from './queries';

const QueryHandlers = [GetCrmCustomersHandler];

@Module({
  imports: [CqrsModule, CrmCustomersInfrastructureModule],
  providers: [...QueryHandlers],
})
export class CrmCustomersApplicationModule {}
