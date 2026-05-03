import { Command } from '@nestjs/cqrs';

export type MarkCrmFeedbackReadResult = {
  feedbackId: string;
  isRead: boolean;
  readAt: string | null;
};

export class MarkCrmFeedbackReadCommand extends Command<MarkCrmFeedbackReadResult> {
  constructor(
    public readonly params: {
      feedbackId: number;
      receiverUserId: number;
    },
  ) {
    super();
  }
}
