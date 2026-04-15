import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CRM_PRODUCT_PACKAGE_CODES,
  type CrmProductPackageCode,
} from '../../domain/crm-customers.constants';

export const UpdateCrmCustomerProductPackageSchema = z.object({
  productPackage: z.enum(CRM_PRODUCT_PACKAGE_CODES),
  dealValue: z.coerce.number().min(0).nullable().optional(),
  note: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export class UpdateCrmCustomerProductPackageDto extends createZodDto(
  UpdateCrmCustomerProductPackageSchema,
) {
  declare productPackage: CrmProductPackageCode;
  declare dealValue: number | null | undefined;
  declare note: string | undefined;
}
