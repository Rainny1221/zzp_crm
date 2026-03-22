import { TokenPair } from '../value-objects/token-pair.vo';

export interface RefreshTokenPayload {
  sub: number;
  jti: string;
  type: string;
}

export const I_TOKEN_SERVICE = Symbol('I_TOKEN_SERVICE');

export interface ITokenService {
  generateTokens(userId: number, roles: string[], device: string): Promise<TokenPair>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  revokeRefreshToken(jti: string, userId: number): Promise<void>;
  revokeAllUserTokens(userId: number): Promise<void>;
  blacklistAccessToken(jti: string, exp: number): Promise<void>;
  getStoredRefreshToken(jti: string): Promise<{ userId: number; device: string; token: string; type?: string } | null>;
}
