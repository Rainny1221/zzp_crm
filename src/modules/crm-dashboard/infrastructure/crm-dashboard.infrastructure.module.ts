import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmDashboardReadRepository } from './repositories/crm-dashboard-read.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmDashboardReadRepository],
  exports: [CrmDashboardReadRepository],
})
export class CrmDashboardInfrastructureModule {}
