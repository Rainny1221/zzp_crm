import { Module } from '@nestjs/common';
import { I_CRM_SYNC_REPOSITORY } from '../domain/repositories/i-crm-sync.repository';
import { I_CRM_SYNC_WRITER_REPOSITORY } from '../domain/repositories/i-crm-sync-writer.repository';
import { CrmSyncPrismaRepository } from './persistence/crm-sync.prisma-repository';
import { CrmSyncWriterPrismaRepository } from './persistence/crm-sync-writer.prisma-repository';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: I_CRM_SYNC_REPOSITORY,
      useClass: CrmSyncPrismaRepository,
    },
    {
      provide: I_CRM_SYNC_WRITER_REPOSITORY,
      useClass: CrmSyncWriterPrismaRepository,
    },
  ],
  exports: [I_CRM_SYNC_REPOSITORY, I_CRM_SYNC_WRITER_REPOSITORY],
})
export class CrmSyncInfrastructureModule {}
