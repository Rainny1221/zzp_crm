import { Command } from '@nestjs/cqrs';

export type UpdateCrmCustomerAssignmentResult = {
  customerId: string;
  dealId: string;
  previousAssigneeId: string | null;
  assigneeId: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    avatarName: string | null;
    roleName: string | null;
  } | null;
  changed: boolean;
  changedAt: string;
};

export class UpdateCrmCustomerAssignmentCommand extends Command<UpdateCrmCustomerAssignmentResult> {
  constructor(
    public readonly params: {
      customerId: number;
      assigneeId: number | null;
      note?: string;
      actorUserId: number;
      actorEmail?: string | null;
      actorRoleName?: string | null;
    },
  ) {
    super();
  }
}
