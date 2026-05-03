import { Module } from '@nestjs/common';
import { CrmNotificationsApplicationModule } from './application/crm-notifications.application.module';
import { CrmNotificationsInfrastructureModule } from './infrastructure/crm-notifications.infrastructure.module';
import { CrmNotificationsController } from './presentation/crm-notifications.controller';

@Module({
  imports: [
    CrmNotificationsApplicationModule,
    CrmNotificationsInfrastructureModule,
  ],
  controllers: [CrmNotificationsController],
})
export class CrmNotificationsModule {}
