import { Command } from '@nestjs/cqrs';
import type {
  CrmDealStatusCode,
  CrmPipelineStageCode,
} from '../../domain/crm-customers.constants';

export type UpdateCrmCustomerPipelineStageResult = {
  customerId: string;
  dealId: string;
  previousPipelineStage: string;
  pipelineStage: CrmPipelineStageCode;
  previousStatus: string | null;
  status: CrmDealStatusCode;
  failureReason: string | null;
  failureNote: string | null;
  changed: boolean;
  changedAt: string;
};

export class UpdateCrmCustomerPipelineStageCommand extends Command<UpdateCrmCustomerPipelineStageResult> {
  constructor(
    public readonly params: {
      customerId: number;
      pipelineStage: CrmPipelineStageCode;
      note?: string;
      failureReason?: string | null;
      failureNote?: string | null;
      actorUserId: number;
      actorEmail?: string | null;
      actorRoleName?: string | null;
    },
  ) {
    super();
  }
}
