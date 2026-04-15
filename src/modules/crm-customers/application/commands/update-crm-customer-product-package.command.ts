import { Command } from '@nestjs/cqrs';
import type { CrmProductPackageCode } from '../../domain/crm-customers.constants';

export type UpdateCrmCustomerProductPackageResult = {
  customerId: string;
  dealId: string;
  previousProductPackage: string | null;
  productPackage: CrmProductPackageCode;
  previousDealValue: number | null;
  dealValue: number | null;
  changed: boolean;
  changedAt: string;
};

export class UpdateCrmCustomerProductPackageCommand extends Command<UpdateCrmCustomerProductPackageResult> {
  constructor(
    public readonly params: {
      customerId: number;
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
