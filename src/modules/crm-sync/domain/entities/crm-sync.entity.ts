import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';

export type CrmSyncJobStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export class CrmSyncEntity {
  private _domainEvents: DomainEvent[] = [];

  constructor(
    public readonly id: number,
    public readonly eventKey: string,
    public readonly eventType: string,
    public readonly userId: number,
    public readonly payload: Record<string, unknown> | null,
    public status: CrmSyncJobStatus,
    public retryCount: number,
    public lastError: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public lockedAt: Date | null = null,
    public processedAt: Date | null = null,
  ) {}

  markProcessing(now: Date) {
    this.status = 'PROCESSING';
    this.lockedAt = now;
    this.updatedAt = now;
  }

  markSuccess(now: Date) {
    this.status = 'SUCCESS';
    this.processedAt = now;
    this.updatedAt = now;
  }

  markFailed(error: string, now: Date) {
    this.status = 'FAILED';
    this.retryCount += 1;
    this.lastError = error;
    this.updatedAt = now;
  }

  canProcess(): boolean {
    return this.status === 'PENDING' || this.status === 'FAILED';
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
