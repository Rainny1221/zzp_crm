import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmNotificationsApplicationModule } from './application/crm-notifications.application.module';
import { CrmNotificationsInfrastructureModule } from './infrastructure/crm-notifications.infrastructure.module';
import { CrmNotificationsController } from './presentation/crm-notifications.controller';

@Module({
  imports: [
    CqrsModule,
    CrmNotificationsApplicationModule,
    CrmNotificationsInfrastructureModule,
  ],
  controllers: [CrmNotificationsController],
  exports: [
    CrmNotificationsApplicationModule,
    CrmNotificationsInfrastructureModule,
  ],
})
export class CrmNotificationsModule {}
