import { Command } from '@nestjs/cqrs';

export type CreateCrmCustomerNoteResult = {
  customerId: string;
  activityId: string;
  type: string;
  content: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  createdAt: string;
};

export class CreateCrmCustomerNoteCommand extends Command<CreateCrmCustomerNoteResult> {
  constructor(
    public readonly params: {
      customerId: number;
      content: string;
      actorUserId: number;
      actorEmail?: string | null;
      actorRoleName?: string | null;
    },
  ) {
    super();
  }
}
