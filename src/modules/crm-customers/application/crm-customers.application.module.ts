import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmCustomersInfrastructureModule } from '../infrastructure/crm-customers.infrastructure.module';
import {
  CreateCrmCustomerInteractionHandler,
  CreateCrmCustomerNoteHandler,
  UpdateCrmCustomerAssignmentHandler,
  UpdateCrmCustomerPipelineStageHandler,
} from './commands';
import { GetCrmCustomerByIdHandler, GetCrmCustomersHandler } from './queries';

const QueryHandlers = [GetCrmCustomersHandler, GetCrmCustomerByIdHandler];
const CommandHandlers = [
  UpdateCrmCustomerAssignmentHandler,
  CreateCrmCustomerNoteHandler,
  CreateCrmCustomerInteractionHandler,
  UpdateCrmCustomerPipelineStageHandler,
];

@Module({
  imports: [CqrsModule, CrmCustomersInfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class CrmCustomersApplicationModule {}
