export class UpdateAvatarCommand {
  constructor(
    public readonly userId: number,
    public readonly avatarKey: string,
  ) {}
}
