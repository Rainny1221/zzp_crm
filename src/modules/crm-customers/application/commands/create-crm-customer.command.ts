import { Command } from '@nestjs/cqrs';
import type { CrmProductPackageCode } from '../../domain/crm-customers.constants';

export type CreateCrmCustomerResult = {
  customerId: string;
  dealId: string;
  pipelineStage: string;
  status: string;
  productPackage: string;
  assigneeId: string | null;
  createdAt: string;
};

export class CreateCrmCustomerCommand extends Command<CreateCrmCustomerResult> {
  constructor(
    public readonly params: {
      shopName?: string;
      phone?: string;
      email?: string;
      tiktokLink?: string;
      gmvMonthly?: number | null;
      industry?: string;
      jobTitle?: string;
      province?: string;
      source: string;
      partnerName?: string;
      sourceNote?: string;
      assigneeId?: number | null;
      productPackage: CrmProductPackageCode;
      dealValue?: number | null;
      note?: string;
      actorUserId: number;
      actorEmail?: string | null;
      actorRoleName?: string | null;
    },
  ) {
    super();
  }
}
