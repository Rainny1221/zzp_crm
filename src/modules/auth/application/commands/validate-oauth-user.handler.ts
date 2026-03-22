import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import type { IAuthRepository } from '../../domain/repositories/i-auth.repository';
import { I_AUTH_REPOSITORY } from '../../domain/repositories/i-auth.repository';
import { ValidateOAuthUserCommand } from './validate-oauth-user.command';

@CommandHandler(ValidateOAuthUserCommand)
export class ValidateOAuthUserHandler implements ICommandHandler<ValidateOAuthUserCommand> {
  private readonly authRepo: IAuthRepository;
  private readonly logger: Logger;

  constructor(
    @Inject(I_AUTH_REPOSITORY)
    authRepo: any,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    logger: Logger,
  ) {
    this.authRepo = authRepo;
    this.logger = logger;
  }

  async execute(command: ValidateOAuthUserCommand) {
    try {
      return await this.authRepo.upsertOAuthUser(command.email);
    } catch (error) {
      this.logger.error(`Lỗi upsert OAuth user: ${error.message}`, error.stack);
      throw ErrorFactory.create(
        ErrorCode.SYSTEM_ERROR_AUTH,
        'Lỗi hệ thống khi khởi tạo tài khoản',
      );
    }
  }
}
