import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';

export class MatchingCreatedEvent implements DomainEvent {
  readonly eventName = 'MatchingCreated';
  readonly occurredOn: Date;

  constructor(public readonly matchingId: number) {
    this.occurredOn = new Date();
  }
}
