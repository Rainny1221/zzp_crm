import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';

export class UserAvatarUpdatedEvent implements DomainEvent {
  readonly eventName = 'UserAvatarUpdated';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: number,
    public readonly avatarKey: string,
  ) {
    this.occurredOn = new Date();
  }
}
