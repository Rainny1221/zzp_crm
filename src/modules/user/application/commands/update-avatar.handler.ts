import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import type { IUserRepository } from '../../domain/repositories/i-user.repository';
import { I_USER_REPOSITORY } from '../../domain/repositories/i-user.repository';
import { UserPresenter } from '../../presentation/user.presenter';
import { UpdateAvatarCommand } from './update-avatar.command';

@CommandHandler(UpdateAvatarCommand)
export class UpdateAvatarHandler implements ICommandHandler<UpdateAvatarCommand> {
  private readonly userRepo: IUserRepository;
  private readonly eventBus: EventBus;
  private readonly logger: Logger;

  constructor(
    @Inject(I_USER_REPOSITORY)
    userRepo: IUserRepository,
    eventBus: EventBus,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    logger: Logger,
  ) {
    this.userRepo = userRepo;
    this.eventBus = eventBus;
    this.logger = logger;
  }

  async execute(command: UpdateAvatarCommand) {
    try {
      const user = await this.userRepo.findById(command.userId);

      if (!user) {
        throw ErrorFactory.create(
          ErrorCode.USER_NOT_FOUND,
          'User not found to update avatar',
        );
      }

      user.updateAvatar(command.avatarKey);

      const saved = await this.userRepo.save(user);

      const events = user.pullDomainEvents();
      events.forEach((event) => {
        this.eventBus.publish(event);
      });

      return UserPresenter.toResponse(saved);
    } catch (error) {
      this.logger.error(error);
      throw ErrorFactory.create(
        ErrorCode.USER_NOT_FOUND,
        'User not found to update avatar',
        error,
      );
    }
  }
}
