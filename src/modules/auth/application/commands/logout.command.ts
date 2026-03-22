export class LogoutCommand {
  constructor(
    public readonly jti: string,
    public readonly userId: number,
    public readonly accessToken?: string,
  ) {}
}
