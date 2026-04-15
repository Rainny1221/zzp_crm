import { Command } from '@nestjs/cqrs';
import type { CrmInteractionChannelCode } from '../../domain/crm-customers.constants';

export type CreateCrmCustomerInteractionResult = {
  customerId: string;
  activityId: string;
  type: string;
  channel: CrmInteractionChannelCode;
  outcomeCode: string;
  summary: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  occurredAt: string;
  lastContactedAt: string;
  lastActivityAt: string;
};

export class CreateCrmCustomerInteractionCommand extends Command<CreateCrmCustomerInteractionResult> {
  constructor(
    public readonly params: {
      customerId: number;
      channel: CrmInteractionChannelCode;
      outcomeCode: string;
      summary: string;
      occurredAt?: string | undefined;
      actorUserId: number;
      actorEmail?: string | null;
      actorRoleName?: string | null;
    },
  ) {
    super();
  }
}
