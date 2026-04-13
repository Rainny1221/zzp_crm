import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmSyncInfrastructureModule } from '../infrastructure/crm-sync.infrastructure.module';
import { GetCrmSyncHandler } from './queries';
import { ProcessCrmSyncJobHandler } from './commands';

const QueryHandlers = [GetCrmSyncHandler];
const CommandHandlers = [ProcessCrmSyncJobHandler];

@Module({
  imports: [CqrsModule, CrmSyncInfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class CrmSyncApplicationModule {}
