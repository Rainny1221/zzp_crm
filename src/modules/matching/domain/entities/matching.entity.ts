import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';
import { MatchingCreatedEvent } from '../events/matching-created.event';

export interface CreateMatchingProps {
  id?: number;
  // TODO: add your entity properties here
}

export class MatchingEntity {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: number,
    // TODO: add private fields here
  ) {}

  static create(props: CreateMatchingProps): MatchingEntity {
    const entity = new MatchingEntity(
      props.id ?? 0,
      // TODO: map props to constructor args
    );
    entity._domainEvents.push(new MatchingCreatedEvent(entity._id));
    return entity;
  }

  // Used when loading from database via mapper
  static reconstitute(props: CreateMatchingProps & { id: number }): MatchingEntity {
    return new MatchingEntity(
      props.id,
      // TODO: map props to constructor args
    );
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  // TODO: add getters and business methods
}
