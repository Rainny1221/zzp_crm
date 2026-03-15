import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { OAuthUserDetails } from './interface/auth.interface';
import { UserWithRoles } from './type/auth.type';
import { TokenType } from './enum/auth.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async validateOAuthUser(details: OAuthUserDetails) {
    try {
      const user: User = await this.prisma.user.upsert({
        where: { email: details.email },
        update: {},
        create: {
          email: details.email,
          is_verified: true,
          is_active: true,
          roles: {
            create: {
              assigned_by: 1,
              role: {
                connectOrCreate: {
                  where: { name: 'USER' },
                  create: { 
                    name: 'USER',
                    display_name: 'Người dùng',
                  },
                },
              },
            },
          },
        },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Lỗi upsert OAuth user: ${error.message}`, error.stack);
      throw ErrorFactory.create(
        ErrorCode.SYSTEM_ERROR_AUTH,
        'Lỗi hệ thống khi khởi tạo tài khoản',
      );
    }
  }

  async generateTokens(user: UserWithRoles, device: string) {
    const userRoles = user.roles.map((ur) => ur.role.name);

    const refreshJti = randomUUID();
    const refreshTokenPayload = {
      sub: user.id,
      jti: refreshJti,
      type: TokenType.REFRESH, 
    };

    const accessTokenPayload = {
      sub: user.id,
      roles: userRoles,
      type: TokenType.ACCESS,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    await this.redisService.set(
      `refresh_token:${refreshJti}`,
      JSON.stringify({
        userId: user.id,
        device: device,
        token: refreshToken,
      }),
      60 * 60 * 24 * 7,
    );

    await this.redisService.sadd(`user_tokens:${user.id}`, refreshJti);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(jti: string, userId: number, accessToken?: string) {
    await this.redisService.del(`refresh_token:${jti}`);
    await this.redisService.srem(`user_tokens:${userId}`, jti);

    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken);
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${jti}`, '1', ttl);
      }
  }

  }

  async logoutAllDevices(userId: number) {
    const tokens = await this.redisService.smembers(`user_tokens:${userId}`);

    if (!tokens.length) return;

    const keys = tokens.map((jti) => `refresh_token:${jti}`);

    await this.redisService.del(...keys);

    await this.redisService.del(`user_tokens:${userId}`);
  }

  async refreshToken(refreshToken: string, device: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const cache = await this.redisService.get(`refresh_token:${payload.jti}`);

      if (!cache) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Refresh token revoked');
      }

      const parsed = JSON.parse(cache);

      if (parsed.token !== refreshToken) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Token mismatch');
      }

      if (parsed.device !== device) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Device mismatch');
      }

      if(parsed.type !== TokenType.REFRESH) {
        throw ErrorFactory.create(ErrorCode.INVALID_TOKEN, 'Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      if (!user || !user.is_active) {
        throw ErrorFactory.create(
          ErrorCode.USER_NOT_FOUND,
          'User not found to refresh token',
        );
      }

      await Promise.all([
        this.redisService.del(`refresh_token:${payload.jti}`),
        this.redisService.srem(`user_tokens:${user.id}`, payload.jti)
      ]);

      const token = await this.generateTokens(user, device);
      
      return token;

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