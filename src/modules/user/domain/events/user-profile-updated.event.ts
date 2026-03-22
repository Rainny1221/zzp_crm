import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';

export class UserProfileUpdatedEvent implements DomainEvent {
  readonly eventName = 'UserProfileUpdated';
  readonly occurredOn: Date;

  constructor(public readonly userId: number) {
    this.occurredOn = new Date();
  }
}
