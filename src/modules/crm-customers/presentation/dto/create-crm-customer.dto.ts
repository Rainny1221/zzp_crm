import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CRM_CUSTOMER_CREATE_DEFAULTS,
  CRM_PRODUCT_PACKAGE_CODES,
  type CrmProductPackageCode,
} from '../../domain/crm-customers.constants';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value ? value : undefined));

export const CreateCrmCustomerSchema = z
  .object({
    shopName: optionalText(255),
    phone: optionalText(50),
    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .nullable()
      .optional()
      .transform((value) => (value ? value : undefined)),
    tiktokLink: z
      .string()
      .trim()
      .url()
      .max(500)
      .nullable()
      .optional()
      .transform((value) => (value ? value : undefined)),
    gmvMonthly: z.coerce.number().min(0).nullable().optional(),
    industry: optionalText(255),
    jobTitle: optionalText(255),
    province: optionalText(255),
    source: z
      .string()
      .trim()
      .min(1)
      .default(CRM_CUSTOMER_CREATE_DEFAULTS.SOURCE_CODE),
    partnerName: optionalText(255),
    sourceNote: optionalText(1000),
    assigneeId: z.coerce.number().int().min(1).nullable().optional(),
    productPackage: z
      .enum(CRM_PRODUCT_PACKAGE_CODES)
      .default(CRM_CUSTOMER_CREATE_DEFAULTS.PRODUCT_PACKAGE_CODE),
    dealValue: z.coerce.number().min(0).nullable().optional(),
    note: optionalText(1000),
  })
  .refine((value) => value.phone || value.email || value.tiktokLink, {
    message: 'At least one contact field is required',
    path: ['contact'],
  });

export class CreateCrmCustomerDto extends createZodDto(
  CreateCrmCustomerSchema,
) {
  declare shopName: string | undefined;
  declare phone: string | undefined;
  declare email: string | undefined;
  declare tiktokLink: string | undefined;
  declare gmvMonthly: number | null | undefined;
  declare industry: string | undefined;
  declare jobTitle: string | undefined;
  declare province: string | undefined;
  declare source: string;
  declare partnerName: string | undefined;
  declare sourceNote: string | undefined;
  declare assigneeId: number | null | undefined;
  declare productPackage: CrmProductPackageCode;
  declare dealValue: number | null | undefined;
  declare note: string | undefined;
}
