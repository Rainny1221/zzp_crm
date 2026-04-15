import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmPipelineInfrastructureModule } from '../infrastructure/crm-pipeline.infrastructure.module';
import { GetCrmPipelineTableHandler } from './queries';

const QueryHandlers = [GetCrmPipelineTableHandler];

@Module({
  imports: [CqrsModule, CrmPipelineInfrastructureModule],
  providers: [...QueryHandlers],
})
export class CrmPipelineApplicationModule {}
