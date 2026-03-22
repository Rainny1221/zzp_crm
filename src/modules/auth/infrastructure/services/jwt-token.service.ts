import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { RedisService } from 'src/redis/redis.service';
import { ITokenService, RefreshTokenPayload } from '../../domain/services/i-token.service';
import { TokenPair } from '../../domain/value-objects/token-pair.vo';
import { TokenType } from '../../domain/value-objects/token-type.vo';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(userId: number, roles: string[], device: string): Promise<TokenPair> {
    const refreshJti = randomUUID();

    const refreshTokenPayload = {
      sub: userId,
      jti: refreshJti,
      type: TokenType.REFRESH,
    };

    const accessTokenPayload = {
      sub: userId,
      roles,
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

    // Store refresh token in Redis
    await this.redisService.set(
      `refresh_token:${refreshJti}`,
      JSON.stringify({
        userId,
        device,
        token: refreshToken,
      }),
      60 * 60 * 24 * 7,
    );

    await this.redisService.sadd(`user_tokens:${userId}`, refreshJti);

    return TokenPair.create(accessToken, refreshToken);
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  async getStoredRefreshToken(jti: string): Promise<{ userId: number; device: string; token: string; type?: string } | null> {
    const cache = await this.redisService.get(`refresh_token:${jti}`);
    if (!cache) return null;
    return JSON.parse(cache);
  }

  async revokeRefreshToken(jti: string, userId: number): Promise<void> {
    await this.redisService.del(`refresh_token:${jti}`);
    await this.redisService.srem(`user_tokens:${userId}`, jti);
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    const tokens = await this.redisService.smembers(`user_tokens:${userId}`);
    if (!tokens.length) return;

    const keys = tokens.map((jti) => `refresh_token:${jti}`);
    await this.redisService.del(...keys);
    await this.redisService.del(`user_tokens:${userId}`);
  }

  async blacklistAccessToken(jti: string, exp: number): Promise<void> {
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redisService.set(`blacklist:${jti}`, '1', ttl);
    }
  }
}
