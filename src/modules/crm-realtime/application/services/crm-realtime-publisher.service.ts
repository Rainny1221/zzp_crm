import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CrmRealtimePublisherService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  notificationCreated(params: { receiverUserIds: number[] }): void {
    if (!params.receiverUserIds.length) return;

    this.eventEmitter.emit('crm.notification.created', params);
  }

  feedbackCreated(params: { receiverUserIds: number[] }): void {
    if (!params.receiverUserIds.length) return;

    this.eventEmitter.emit('crm.feedback.created', params);
  }
}
