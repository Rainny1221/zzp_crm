import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITokenService } from '../../domain/services/i-token.service';
import { I_TOKEN_SERVICE } from '../../domain/services/i-token.service';
import { LogoutAllDevicesCommand } from './logout-all-devices.command';

@CommandHandler(LogoutAllDevicesCommand)
export class LogoutAllDevicesHandler implements ICommandHandler<LogoutAllDevicesCommand> {
  private readonly tokenService: ITokenService;

  constructor(
    @Inject(I_TOKEN_SERVICE)
    tokenService: any,
  ) {
    this.tokenService = tokenService;
  }

  async execute(command: LogoutAllDevicesCommand): Promise<void> {
    await this.tokenService.revokeAllUserTokens(command.userId);
  }
}
