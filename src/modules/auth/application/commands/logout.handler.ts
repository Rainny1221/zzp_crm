import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import type { ITokenService } from '../../domain/services/i-token.service';
import { I_TOKEN_SERVICE } from '../../domain/services/i-token.service';
import { LogoutCommand } from './logout.command';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  private readonly tokenService: ITokenService;
  private readonly jwtService: JwtService;

  constructor(
    @Inject(I_TOKEN_SERVICE)
    tokenService: any,
    jwtService: JwtService,
  ) {
    this.tokenService = tokenService;
    this.jwtService = jwtService;
  }

  async execute(command: LogoutCommand): Promise<void> {
    await this.tokenService.revokeRefreshToken(command.jti, command.userId);

    if (command.accessToken) {
      const decoded = this.jwtService.decode(command.accessToken);
      await this.tokenService.blacklistAccessToken(command.jti, decoded.exp);
    }
  }
}
