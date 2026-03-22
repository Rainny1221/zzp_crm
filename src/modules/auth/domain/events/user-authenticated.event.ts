import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';

export class UserAuthenticatedEvent implements DomainEvent {
  readonly eventName = 'UserAuthenticated';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: number,
    public readonly email: string,
  ) {
    this.occurredOn = new Date();
  }
}
