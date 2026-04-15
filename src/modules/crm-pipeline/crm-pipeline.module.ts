import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmPipelineApplicationModule } from './application/crm-pipeline.application.module';
import { CrmPipelineInfrastructureModule } from './infrastructure/crm-pipeline.infrastructure.module';
import { CrmPipelineController } from './presentation/crm-pipeline.controller';

@Module({
  imports: [
    CqrsModule,
    CrmPipelineInfrastructureModule,
    CrmPipelineApplicationModule,
  ],
  controllers: [CrmPipelineController],
  exports: [CrmPipelineApplicationModule, CrmPipelineInfrastructureModule],
})
export class CrmPipelineModule {}
