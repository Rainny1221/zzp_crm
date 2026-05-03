import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmFeedbackApplicationModule } from './application/crm-feedback.application.module';
import { CrmFeedbackInfrastructureModule } from './infrastructure/crm-feedback.infrastructure.module';
import { CrmFeedbackController } from './presentation/crm-feedback.controller';

@Module({
  imports: [
    CqrsModule,
    CrmFeedbackApplicationModule,
    CrmFeedbackInfrastructureModule,
  ],
  controllers: [CrmFeedbackController],
  exports: [CrmFeedbackApplicationModule, CrmFeedbackInfrastructureModule],
})
export class CrmFeedbackModule {}
