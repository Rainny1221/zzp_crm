import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { CrmSyncDomainModule } from './domain/crm-sync.domain.module';
import { CrmSyncInfrastructureModule } from './infrastructure/crm-sync.infrastructure.module';
import { CrmSyncApplicationModule } from './application/crm-sync.application.module';
import { CrmSyncController } from './presentation/crm-sync.controller';
import { CRM_SYNC_QUEUE } from './domain/crm-sync.constants';
import { CrmSyncQueueBootstrap } from './infrastructure/queue/crm-sync-queue.bootstrap';
import { CrmSyncQueueProcessor } from './infrastructure/queue/crm-sync-queue.processor';

@Module({
  imports: [
    CqrsModule,
    BullModule.registerQueue({
      name: CRM_SYNC_QUEUE.NAME,
    }),
    BullBoardModule.forFeature({
      name: CRM_SYNC_QUEUE.NAME,
      adapter: BullMQAdapter,
    }),
    CrmSyncDomainModule,
    CrmSyncInfrastructureModule,
    CrmSyncApplicationModule,
  ],
  controllers: [CrmSyncController],
  providers: [CrmSyncQueueBootstrap, CrmSyncQueueProcessor],
  exports: [CrmSyncApplicationModule, CrmSyncInfrastructureModule],
})
export class CrmSyncModule {}
