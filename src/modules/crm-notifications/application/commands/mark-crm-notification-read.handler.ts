import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CrmNotificationsWriteRepository } from '../../infrastructure/repositories/crm-notifications-write.repository';
import {
  MarkCrmNotificationReadCommand,
  MarkCrmNotificationReadResult,
} from './mark-crm-notification-read.command';

@CommandHandler(MarkCrmNotificationReadCommand)
export class MarkCrmNotificationReadHandler implements ICommandHandler<
  MarkCrmNotificationReadCommand,
  MarkCrmNotificationReadResult
> {
  constructor(private readonly repository: CrmNotificationsWriteRepository) {}

  async execute(
    command: MarkCrmNotificationReadCommand,
  ): Promise<MarkCrmNotificationReadResult> {
    return this.repository.markRead(command.params);
  }
}
