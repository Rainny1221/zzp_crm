import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmCustomersInfrastructureModule } from '../infrastructure/crm-customers.infrastructure.module';
import {
  CreateCrmCustomerHandler,
  CreateCrmCustomerInteractionHandler,
  CreateCrmCustomerNoteHandler,
  UpdateCrmCustomerAssignmentHandler,
  UpdateCrmCustomerPipelineStageHandler,
  UpdateCrmCustomerProductPackageHandler,
} from './commands';
import { GetCrmCustomerByIdHandler, GetCrmCustomersHandler } from './queries';

const QueryHandlers = [GetCrmCustomersHandler, GetCrmCustomerByIdHandler];
const CommandHandlers = [
  CreateCrmCustomerHandler,
  UpdateCrmCustomerAssignmentHandler,
  CreateCrmCustomerNoteHandler,
  CreateCrmCustomerInteractionHandler,
  UpdateCrmCustomerPipelineStageHandler,
  UpdateCrmCustomerProductPackageHandler,
];

@Module({
  imports: [CqrsModule, CrmCustomersInfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class CrmCustomersApplicationModule {}
