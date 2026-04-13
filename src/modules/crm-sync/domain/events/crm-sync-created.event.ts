import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';

export class CrmSyncCreatedEvent implements DomainEvent {
  readonly eventName = 'CrmSyncCreated';
  readonly occurredOn: Date;

  constructor(public readonly crmsyncId: number) {
    this.occurredOn = new Date();
  }
}
