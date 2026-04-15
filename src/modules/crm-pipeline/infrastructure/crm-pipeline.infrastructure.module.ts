import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmPipelineReadRepository } from './repositories/crm-pipeline-read.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmPipelineReadRepository],
  exports: [CrmPipelineReadRepository],
})
export class CrmPipelineInfrastructureModule {}
