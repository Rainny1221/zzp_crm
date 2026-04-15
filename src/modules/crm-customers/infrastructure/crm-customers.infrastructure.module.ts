import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmCustomersReadRepository } from './repositories/crm-customers-read.repository';
import { CrmCustomersWriteRepository } from './repositories/crm-customers-write.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmCustomersReadRepository, CrmCustomersWriteRepository],
  exports: [CrmCustomersReadRepository, CrmCustomersWriteRepository],
})
export class CrmCustomersInfrastructureModule {}
