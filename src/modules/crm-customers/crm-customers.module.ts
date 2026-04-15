import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmCustomersApplicationModule } from './application/crm-customers.application.module';
import { CrmCustomersInfrastructureModule } from './infrastructure/crm-customers.infrastructure.module';
import { CrmCustomersController } from './presentation/crm-customers.controller';

@Module({
  imports: [
    CqrsModule,
    CrmCustomersInfrastructureModule,
    CrmCustomersApplicationModule,
  ],
  controllers: [CrmCustomersController],
  exports: [CrmCustomersApplicationModule, CrmCustomersInfrastructureModule],
})
export class CrmCustomersModule {}
