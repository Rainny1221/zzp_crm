import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmNotificationsInfrastructureModule } from '../infrastructure/crm-notifications.infrastructure.module';
import { MarkCrmNotificationReadHandler } from './commands';
import { GetCrmNotificationsHandler } from './queries';

@Module({
  imports: [CqrsModule, CrmNotificationsInfrastructureModule],
  providers: [GetCrmNotificationsHandler, MarkCrmNotificationReadHandler],
})
export class CrmNotificationsApplicationModule {}
