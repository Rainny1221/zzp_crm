import {
  CanActivate,
  ExecutionContext,
  Injectable
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { TokenType } from 'src/auth/enum/auth.enum';
import { IS_PUBLIC_KEY } from '../decorator/require-permissions.decorator';
import { ErrorCode } from '../enums/error-codes.enum';
import { ErrorFactory } from '../error.factory';

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

    const req = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'No token provided');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload.type !== TokenType.ACCESS) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Invalid token type');
      }

      req['user'] = payload;
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Invalid token');
      }
      throw error;
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}