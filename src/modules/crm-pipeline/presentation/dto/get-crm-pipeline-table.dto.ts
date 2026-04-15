import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CRM_PIPELINE_TABLE_FOCUS_VALUES = [
  'all',
  'closing',
  'stuck',
  'expiring',
] as const;

export const CRM_PIPELINE_TABLE_BOOLEAN_FILTER_VALUES = [
  'all',
  'true',
  'false',
] as const;

export const CRM_PIPELINE_TABLE_SORT_KEY_VALUES = [
  'value',
  'lastActivityAt',
  'stageTransitionAt',
  'createdAt',
  'probability',
  'revenue',
  'gmvMonthly',
  'shopName',
  'status',
  'pipelineStage',
  'productPackage',
  'owner',
  'openTaskCount',
  'lastContactedAt',
  'trialStartDate',
  'trialEndDate',
] as const;

export const CRM_PIPELINE_TABLE_SORT_DIRECTION_VALUES = [
  'asc',
  'desc',
] as const;

const optionalDateTime = z
  .string()
  .trim()
  .datetime({ offset: true })
  .optional();

export const GetCrmPipelineTableSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  pipelineStage: z.string().trim().min(1).default('all'),
  status: z.string().trim().min(1).default('all'),
  productPackage: z.string().trim().min(1).default('all'),
  tier: z.string().trim().min(1).default('all'),
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
  focus: z.enum(CRM_PIPELINE_TABLE_FOCUS_VALUES).default('all'),
  isActive: z.enum(CRM_PIPELINE_TABLE_BOOLEAN_FILTER_VALUES).default('all'),
  isClosing: z.enum(CRM_PIPELINE_TABLE_BOOLEAN_FILTER_VALUES).default('all'),
  isStuck: z.enum(CRM_PIPELINE_TABLE_BOOLEAN_FILTER_VALUES).default('all'),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  minRevenue: z.coerce.number().min(0).optional(),
  maxRevenue: z.coerce.number().min(0).optional(),
  minGmv: z.coerce.number().min(0).optional(),
  maxGmv: z.coerce.number().min(0).optional(),
  minProbability: z.coerce.number().int().min(0).max(100).optional(),
  maxProbability: z.coerce.number().int().min(0).max(100).optional(),
  minOpenTaskCount: z.coerce.number().int().min(0).optional(),
  maxOpenTaskCount: z.coerce.number().int().min(0).optional(),
  createdFrom: optionalDateTime,
  createdTo: optionalDateTime,
  lastActivityFrom: optionalDateTime,
  lastActivityTo: optionalDateTime,
  lastContactedFrom: optionalDateTime,
  lastContactedTo: optionalDateTime,
  stageTransitionFrom: optionalDateTime,
  stageTransitionTo: optionalDateTime,
  trialEndFrom: optionalDateTime,
  trialEndTo: optionalDateTime,
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortKey: z.enum(CRM_PIPELINE_TABLE_SORT_KEY_VALUES).default('value'),
  sortDirection: z
    .enum(CRM_PIPELINE_TABLE_SORT_DIRECTION_VALUES)
    .default('desc'),
});

export type CrmPipelineTableFocus =
  (typeof CRM_PIPELINE_TABLE_FOCUS_VALUES)[number];
export type CrmPipelineTableBooleanFilter =
  (typeof CRM_PIPELINE_TABLE_BOOLEAN_FILTER_VALUES)[number];
export type CrmPipelineTableSortKey =
  (typeof CRM_PIPELINE_TABLE_SORT_KEY_VALUES)[number];
export type CrmPipelineTableSortDirection =
  (typeof CRM_PIPELINE_TABLE_SORT_DIRECTION_VALUES)[number];

export class GetCrmPipelineTableDto extends createZodDto(
  GetCrmPipelineTableSchema,
) {
  declare search: string | undefined;
  declare pipelineStage: string;
  declare status: string;
  declare productPackage: string;
  declare tier: string;
  declare source: string;
  declare assignee: string;
  declare focus: CrmPipelineTableFocus;
  declare isActive: CrmPipelineTableBooleanFilter;
  declare isClosing: CrmPipelineTableBooleanFilter;
  declare isStuck: CrmPipelineTableBooleanFilter;
  declare minValue: number | undefined;
  declare maxValue: number | undefined;
  declare minRevenue: number | undefined;
  declare maxRevenue: number | undefined;
  declare minGmv: number | undefined;
  declare maxGmv: number | undefined;
  declare minProbability: number | undefined;
  declare maxProbability: number | undefined;
  declare minOpenTaskCount: number | undefined;
  declare maxOpenTaskCount: number | undefined;
  declare createdFrom: string | undefined;
  declare createdTo: string | undefined;
  declare lastActivityFrom: string | undefined;
  declare lastActivityTo: string | undefined;
  declare lastContactedFrom: string | undefined;
  declare lastContactedTo: string | undefined;
  declare stageTransitionFrom: string | undefined;
  declare stageTransitionTo: string | undefined;
  declare trialEndFrom: string | undefined;
  declare trialEndTo: string | undefined;
  declare page: number;
  declare limit: number;
  declare sortKey: CrmPipelineTableSortKey;
  declare sortDirection: CrmPipelineTableSortDirection;
}
