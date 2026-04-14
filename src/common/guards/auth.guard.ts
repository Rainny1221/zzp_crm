import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorator/require-permissions.decorator';
import { ErrorCode } from '../enums/error-codes.enum';
import { ErrorFactory } from '../error.factory';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../interfaces/authenticated-request.interface';

interface ExternalTokenUser {
  id?: number;
  email?: string;
  roleId?: number;
  roleName?: string;
  currentParentUserId?: number | null;
  isBlock?: boolean;
  isActive?: boolean;
}

interface AccessTokenPayload {
  id?: number;
  sub?: number;
  email?: string;
  roleId?: number;
  roleName?: string;
  currentParentUserId?: number | null;
  isBlock?: boolean;
  isActive?: boolean;
  type?: string;
  typeToken?: string;
  user?: ExternalTokenUser;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'No token provided');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret,
        },
      );

      if (!this.isAccessToken(payload)) {
        throw ErrorFactory.create(
          ErrorCode.INVALID_TOKEN,
          'Invalid token type',
        );
      }

      req.user = this.normalizeUser(payload);
    } catch (error) {
      if (
        error instanceof JsonWebTokenError ||
        error instanceof TokenExpiredError
      ) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Invalid token');
      }
      throw error;
    }

    return true;
  }

  private extractTokenFromHeader(
    request: AuthenticatedRequest,
  ): string | undefined {
    const authorization = request.headers.authorization?.trim();
    if (!authorization) return undefined;

    const [type, token] = authorization.split(/\s+/);
    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }

  private isAccessToken(payload: AccessTokenPayload): boolean {
    return payload.type === 'ACCESS' || payload.typeToken === 'ACCESS_TOKEN';
  }

  private normalizeUser(payload: AccessTokenPayload): AuthenticatedUser {
    const user = payload.user ?? payload;
    const userId = Number(user.id ?? payload.sub);

    if (!userId) {
      throw ErrorFactory.create(
        ErrorCode.INVALID_TOKEN,
        'Token payload missing user id',
      );
    }

    if (user.isBlock) {
      throw ErrorFactory.create(ErrorCode.FORBIDDEN_ACCESS, 'User is blocked');
    }

    if (user.isActive === false) {
      throw ErrorFactory.create(ErrorCode.FORBIDDEN_ACCESS, 'User is inactive');
    }

    return {
      id: userId,
      sub: userId,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      currentParentUserId: user.currentParentUserId ?? null,
      isBlock: Boolean(user.isBlock),
      isActive: user.isActive ?? true,
      tokenType: payload.typeToken ?? payload.type,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
