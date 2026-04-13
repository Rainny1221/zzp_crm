import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmSyncDomainModule } from './domain/crm-sync.domain.module';
import { CrmSyncInfrastructureModule } from './infrastructure/crm-sync.infrastructure.module';
import { CrmSyncApplicationModule } from './application/crm-sync.application.module';
import { CrmSyncController } from './presentation/crm-sync.controller';

@Module({
  imports: [
    CqrsModule,
    CrmSyncDomainModule,
    CrmSyncInfrastructureModule,
    CrmSyncApplicationModule,
  ],
  controllers: [CrmSyncController],
  exports: [CrmSyncApplicationModule, CrmSyncInfrastructureModule],
})
export class CrmSyncModule {}
