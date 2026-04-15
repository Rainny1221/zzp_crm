import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CRM_CUSTOMER_TIER_FILTER_VALUES = [
  'all',
  'whale',
  'potential',
  'tiny',
] as const;

export const CRM_CUSTOMER_STATUS_FILTER_VALUES = [
  'all',
  'new',
  'trial',
  'failed',
  'success',
] as const;

export const CRM_CUSTOMER_FOCUS_FILTER_VALUES = [
  'all',
  'unassigned_leads',
] as const;

export const GetCrmCustomersSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  tier: z.enum(CRM_CUSTOMER_TIER_FILTER_VALUES).default('all'),
  status: z.enum(CRM_CUSTOMER_STATUS_FILTER_VALUES).default('all'),
  source: z.string().trim().min(1).default('all'),
  assignee: z
    .string()
    .trim()
    .min(1)
    .default('all')
    .refine(
      (value) =>
        value === 'all' || value === 'unassigned' || /^\d+$/.test(value),
      {
        message: 'assignee must be all, unassigned, or a user id',
      },
    ),
  focus: z.enum(CRM_CUSTOMER_FOCUS_FILTER_VALUES).default('all'),
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CrmCustomerTierFilter =
  (typeof CRM_CUSTOMER_TIER_FILTER_VALUES)[number];
export type CrmCustomerStatusFilter =
  (typeof CRM_CUSTOMER_STATUS_FILTER_VALUES)[number];
export type CrmCustomerFocusFilter =
  (typeof CRM_CUSTOMER_FOCUS_FILTER_VALUES)[number];

export class GetCrmCustomersDto extends createZodDto(GetCrmCustomersSchema) {
  declare search: string | undefined;
  declare tier: CrmCustomerTierFilter;
  declare status: CrmCustomerStatusFilter;
  declare source: string;
  declare assignee: string;
  declare focus: CrmCustomerFocusFilter;
  declare page: number;
  declare limit: number;
}
