import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrmFeedbackReadRepository } from './repositories/crm-feedback-read.repository';
import { CrmFeedbackWriteRepository } from './repositories/crm-feedback-write.repository';

@Module({
  imports: [PrismaModule],
  providers: [CrmFeedbackReadRepository, CrmFeedbackWriteRepository],
  exports: [CrmFeedbackReadRepository, CrmFeedbackWriteRepository],
})
export class CrmFeedbackInfrastructureModule {}
