import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import type { IMatchingRepository } from '../../domain/repositories/i-matching.repository';
import { I_MATCHING_REPOSITORY } from '../../domain/repositories/i-matching.repository';
import { CreateMatchingCommand } from './create-matching.command';

@CommandHandler(CreateMatchingCommand)
export class CreateMatchingHandler implements ICommandHandler<CreateMatchingCommand> {
  private readonly repo: IMatchingRepository;
  private readonly eventBus: EventBus;

  constructor(
    @Inject(I_MATCHING_REPOSITORY)
    repo: any,
    eventBus: EventBus,
  ) {
    this.repo = repo;
    this.eventBus = eventBus;
  }

  async execute(command: CreateMatchingCommand) {
    // TODO: implement command logic
    // 1. Load entity from repository
    // 2. Call domain method
    // 3. Persist changes
    // 4. Dispatch domain events

    const entity = await this.repo.findById(command.id);
    if (!entity) {
      throw new Error('Matching not found');
    }

    const saved = await this.repo.save(entity);

    const events = entity.pullDomainEvents();
    events.forEach((e) => this.eventBus.publish(e));

    return { id: saved.id };
  }
}
