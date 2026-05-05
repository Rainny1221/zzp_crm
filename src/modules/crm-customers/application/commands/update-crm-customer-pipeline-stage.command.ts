import { Command } from '@nestjs/cqrs';
import type {
  CrmDealStatusCode,
  CrmPipelineStageCode,
  CrmProductPackageCode,
} from '../../domain/crm-customers.constants';

export type UpdateCrmCustomerPipelineStageResult = {
  customerId: string;
  dealId: string;
  previousPipelineStage: string;
  pipelineStage: CrmPipelineStageCode;
  previousStatus: string | null;
  status: CrmDealStatusCode;
  productPackage: string | null;
  finalContractValue: number | null;
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
      productPackage?: CrmProductPackageCode;
      finalContractValue?: number;
      actorUserId: number;
      actorEmail?: string | null;
      actorRoleName?: string | null;
    },
  ) {
    super();
  }
}
