import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITokenService } from '../../domain/services/i-token.service';
import { I_TOKEN_SERVICE } from '../../domain/services/i-token.service';
import { GenerateTokensCommand } from './generate-tokens.command';

@CommandHandler(GenerateTokensCommand)
export class GenerateTokensHandler implements ICommandHandler<GenerateTokensCommand> {
  private readonly tokenService: ITokenService;

  constructor(
    @Inject(I_TOKEN_SERVICE)
    tokenService: any,
  ) {
    this.tokenService = tokenService;
  }

  async execute(command: GenerateTokensCommand) {
    const tokenPair = await this.tokenService.generateTokens(
      command.userId,
      command.roles,
      command.device,
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }
}
