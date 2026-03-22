export class GenerateTokensCommand {
  constructor(
    public readonly userId: number,
    public readonly roles: string[],
    public readonly device: string,
  ) {}
}
