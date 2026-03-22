import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import type { IAuthRepository } from '../../domain/repositories/i-auth.repository';
import { I_AUTH_REPOSITORY } from '../../domain/repositories/i-auth.repository';
import type { ITokenService } from '../../domain/services/i-token.service';
import { I_TOKEN_SERVICE } from '../../domain/services/i-token.service';
import { TokenType } from '../../domain/value-objects/token-type.vo';
import { RefreshTokenCommand } from './refresh-token.command';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  private readonly tokenService: ITokenService;
  private readonly authRepo: IAuthRepository;

  constructor(
    @Inject(I_TOKEN_SERVICE)
    tokenService: any,
    @Inject(I_AUTH_REPOSITORY)
    authRepo: any,
  ) {
    this.tokenService = tokenService;
    this.authRepo = authRepo;
  }

  async execute(command: RefreshTokenCommand) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(command.refreshToken);

      const stored = await this.tokenService.getStoredRefreshToken(payload.jti);

      if (!stored) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Refresh token revoked');
      }

      if (stored.token !== command.refreshToken) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Token mismatch');
      }

      if (stored.device !== command.device) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Device mismatch');
      }

      if (stored.type !== undefined && stored.type !== TokenType.REFRESH) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Invalid token type');
      }

      const user = await this.authRepo.findUserWithRolesById(payload.sub);

      if (!user || !user.isActive) {
        throw ErrorFactory.create(
          ErrorCode.USER_NOT_FOUND,
          'User not found to refresh token',
        );
      }

      // Revoke old token, then generate new pair
      await this.tokenService.revokeRefreshToken(payload.jti, user.id);

      const tokenPair = await this.tokenService.generateTokens(
        user.id,
        user.roles,
        command.device,
      );

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw ErrorFactory.create(
          ErrorCode.INVALID_TOKEN,
          'Refresh token is expired or invalid',
        );
      }
      throw error;
    }
  }
}
