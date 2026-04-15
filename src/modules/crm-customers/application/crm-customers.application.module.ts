import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmCustomersInfrastructureModule } from '../infrastructure/crm-customers.infrastructure.module';
import { UpdateCrmCustomerAssignmentHandler } from './commands';
import { GetCrmCustomerByIdHandler, GetCrmCustomersHandler } from './queries';

const QueryHandlers = [GetCrmCustomersHandler, GetCrmCustomerByIdHandler];
const CommandHandlers = [UpdateCrmCustomerAssignmentHandler];

@Module({
  imports: [CqrsModule, CrmCustomersInfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class CrmCustomersApplicationModule {}
