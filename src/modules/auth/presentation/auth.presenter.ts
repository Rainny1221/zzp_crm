export class AuthPresenter {
  static toTokenResponse(tokens: { accessToken: string; refreshToken: string }) {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}
