import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CrmFeedbackWriteRepository } from '../../infrastructure/repositories/crm-feedback-write.repository';
import {
  MarkCrmFeedbackReadCommand,
  MarkCrmFeedbackReadResult,
} from './mark-crm-feedback-read.command';

@CommandHandler(MarkCrmFeedbackReadCommand)
export class MarkCrmFeedbackReadHandler implements ICommandHandler<
  MarkCrmFeedbackReadCommand,
  MarkCrmFeedbackReadResult
> {
  constructor(private readonly repository: CrmFeedbackWriteRepository) {}

  async execute(
    command: MarkCrmFeedbackReadCommand,
  ): Promise<MarkCrmFeedbackReadResult> {
    return this.repository.markRead(command.params);
  }
}
