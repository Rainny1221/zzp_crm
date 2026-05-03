import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmFeedbackInfrastructureModule } from '../infrastructure/crm-feedback.infrastructure.module';
import { MarkCrmFeedbackReadHandler } from './commands';
import { GetCrmFeedbackHandler } from './queries';

@Module({
  imports: [CqrsModule, CrmFeedbackInfrastructureModule],
  providers: [GetCrmFeedbackHandler, MarkCrmFeedbackReadHandler],
})
export class CrmFeedbackApplicationModule {}
