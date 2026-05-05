import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CrmSseHubService } from '../../infrastructure/services/crm-sse-hub.service';

@Injectable()
export class CrmRealtimeEventsListener {
  constructor(private readonly hub: CrmSseHubService) {}

  @OnEvent('crm.notification.created')
  handleNotificationCreated(payload: { receiverUserIds: number[] }): void {
    this.hub.publishToUsers(payload.receiverUserIds, () => ({
      type: 'crm.notification.created',
      data: {
        ts: new Date().toISOString(),
      },
    }));
  }

  @OnEvent('crm.feedback.created')
  handleFeedbackCreated(payload: { receiverUserIds: number[] }): void {
    this.hub.publishToUsers(payload.receiverUserIds, () => ({
      type: 'crm.feedback.created',
      data: {
        ts: new Date().toISOString(),
      },
    }));
  }
}
