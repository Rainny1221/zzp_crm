import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import type { MarkCrmFeedbackReadResult } from '../../application/commands';

@Injectable()
export class CrmFeedbackWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async markRead(params: {
    feedbackId: number;
    receiverUserId: number;
  }): Promise<MarkCrmFeedbackReadResult> {
    const feedback = await this.prisma.crmFeedback.findFirst({
      where: {
        id: params.feedbackId,
        receiver_user_id: params.receiverUserId,
      },
      select: {
        id: true,
        is_read: true,
        read_at: true,
      },
    });

    if (!feedback) {
      throw ErrorFactory.create(
        ErrorCode.ITEM_NOT_FOUND,
        'CRM feedback not found',
        params,
      );
    }

    if (feedback.is_read) {
      return {
        feedbackId: String(feedback.id),
        isRead: true,
        readAt: feedback.read_at?.toISOString() ?? null,
      };
    }

    const updated = await this.prisma.crmFeedback.update({
      where: {
        id: feedback.id,
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
      feedbackId: String(updated.id),
      isRead: updated.is_read,
      readAt: updated.read_at?.toISOString() ?? null,
    };
  }
}
