import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import type { MarkCrmNotificationReadResult } from '../../application/commands';

@Injectable()
export class CrmNotificationsWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async markRead(params: {
    notificationId: number;
    receiverUserId: number;
  }): Promise<MarkCrmNotificationReadResult> {
    const notification = await this.prisma.crmNotifications.findFirst({
      where: {
        id: params.notificationId,
        receiver_user_id: params.receiverUserId,
      },
      select: {
        id: true,
        is_read: true,
        read_at: true,
      },
    });

    if (!notification) {
      throw ErrorFactory.create(
        ErrorCode.ITEM_NOT_FOUND,
        'CRM notification not found',
        params,
      );
    }

    if (notification.is_read) {
      return {
        notificationId: String(notification.id),
        isRead: true,
        readAt: notification.read_at?.toISOString() ?? null,
      };
    }

    const updated = await this.prisma.crmNotifications.update({
      where: {
        id: notification.id,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
      select: {
        id: true,
        is_read: true,
        read_at: true,
      },
    });

    return {
      notificationId: String(updated.id),
      isRead: updated.is_read,
      readAt: updated.read_at?.toISOString() ?? null,
    };
  }
}
