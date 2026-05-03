import { Command } from '@nestjs/cqrs';

export type MarkCrmNotificationReadResult = {
  notificationId: string;
  isRead: boolean;
  readAt: string | null;
};

export class MarkCrmNotificationReadCommand extends Command<MarkCrmNotificationReadResult> {
  constructor(
    public readonly params: {
      notificationId: number;
      receiverUserId: number;
    },
  ) {
    super();
  }
}
