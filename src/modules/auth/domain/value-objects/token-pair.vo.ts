export class TokenPair {
  private constructor(
    private readonly _accessToken: string,
    private readonly _refreshToken: string,
  ) {}

  static create(accessToken: string, refreshToken: string): TokenPair {
    return new TokenPair(accessToken, refreshToken);
  }

  get accessToken(): string {
    return this._accessToken;
  }

  get refreshToken(): string {
    return this._refreshToken;
  }

  equals(other: TokenPair): boolean {
    return (
      this._accessToken === other._accessToken &&
      this._refreshToken === other._refreshToken
    );
  }
}
