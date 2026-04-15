import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmCustomersReadRepository } from './repositories/crm-customers-read.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmCustomersReadRepository],
  exports: [CrmCustomersReadRepository],
})
export class CrmCustomersInfrastructureModule {}
