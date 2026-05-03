import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpsertCrmKpiSalesTargetSchema = z.object({
  periodType: z.enum(['monthly']).default('monthly'),
  periodStart: z.string().date(),
  leadsTarget: z.coerce.number().int().min(0).default(0),
  qualifiedTarget: z.coerce.number().int().min(0).default(0),
  wonDealsTarget: z.coerce.number().int().min(0).default(0),
  pipelineValueTarget: z.coerce.number().min(0).default(0),
  wonValueTarget: z.coerce.number().min(0).default(0),
});

export class UpsertCrmKpiSalesTargetDto extends createZodDto(
  UpsertCrmKpiSalesTargetSchema,
) {
  declare periodType: 'monthly';
  declare periodStart: string;
  declare leadsTarget: number;
  declare qualifiedTarget: number;
  declare wonDealsTarget: number;
  declare pipelineValueTarget: number;
  declare wonValueTarget: number;
}
