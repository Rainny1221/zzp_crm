import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmKpiReadRepository } from './repositories/crm-kpi-read.repository';
import { CrmKpiWriteRepository } from './repositories/crm-kpi-write.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmKpiReadRepository, CrmKpiWriteRepository],
  exports: [CrmKpiReadRepository, CrmKpiWriteRepository],
})
export class CrmKpiInfrastructureModule {}
