import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmSyncInfrastructureModule } from '../infrastructure/crm-sync.infrastructure.module';
import { GetCrmSyncHandler, GetCrmSyncJobsHandler } from './queries';
import {
  BackfillCrmSyncHandler,
  ProcessCrmSyncJobHandler,
  ReplayCrmSyncJobHandler,
} from './commands';

const QueryHandlers = [GetCrmSyncHandler, GetCrmSyncJobsHandler];
const CommandHandlers = [
  ProcessCrmSyncJobHandler,
  ReplayCrmSyncJobHandler,
  BackfillCrmSyncHandler,
];

@Module({
  imports: [CqrsModule, CrmSyncInfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class CrmSyncApplicationModule {}
