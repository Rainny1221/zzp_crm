import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmKpiReadRepository } from './repositories/crm-kpi-read.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmKpiReadRepository],
  exports: [CrmKpiReadRepository],
})
export class CrmKpiInfrastructureModule {}
