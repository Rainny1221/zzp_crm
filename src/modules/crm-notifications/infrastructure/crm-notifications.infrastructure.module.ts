import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmNotificationsReadRepository } from './repositories/crm-notifications-read.repository';
import { CrmNotificationsWriteRepository } from './repositories/crm-notifications-write.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmNotificationsReadRepository, CrmNotificationsWriteRepository],
  exports: [CrmNotificationsReadRepository, CrmNotificationsWriteRepository],
})
export class CrmNotificationsInfrastructureModule {}
