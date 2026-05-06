import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmSyncInfrastructureModule } from '../infrastructure/crm-sync.infrastructure.module';
import { GetCrmSyncHandler, GetCrmSyncJobsHandler } from './queries';
import {
  BackfillCrmSyncHandler,
  ProcessCrmSyncJobHandler,
  ReplayCrmSyncJobHandler,
} from './commands';
import { CrmSyncEligibilityService } from './crm-sync-eligibility.service';
import { CrmSellerSyncService } from './crm-seller-sync.service';
import { TiktokShopAuthorizationReaderService } from './tiktok-shop-authorization-reader.service';

const QueryHandlers = [GetCrmSyncHandler, GetCrmSyncJobsHandler];
const CommandHandlers = [
  ProcessCrmSyncJobHandler,
  ReplayCrmSyncJobHandler,
  BackfillCrmSyncHandler,
];

const CrmSellerSyncServices = [
  CrmSyncEligibilityService,
  TiktokShopAuthorizationReaderService,
  CrmSellerSyncService,
];

@Module({
  imports: [CqrsModule, CrmSyncInfrastructureModule, PrismaModule],
  providers: [...QueryHandlers, ...CommandHandlers, ...CrmSellerSyncServices],
})
export class CrmSyncApplicationModule {}
