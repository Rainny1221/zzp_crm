import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmCustomersInfrastructureModule } from '../infrastructure/crm-customers.infrastructure.module';
import { GetCrmCustomerByIdHandler, GetCrmCustomersHandler } from './queries';

const QueryHandlers = [GetCrmCustomersHandler, GetCrmCustomerByIdHandler];

@Module({
  imports: [CqrsModule, CrmCustomersInfrastructureModule],
  providers: [...QueryHandlers],
})
export class CrmCustomersApplicationModule {}
