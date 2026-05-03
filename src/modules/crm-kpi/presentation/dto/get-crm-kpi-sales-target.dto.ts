import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetCrmKpiSalesTargetSchema = z.object({
  periodType: z.enum(['monthly']).default('monthly'),
  periodStart: z.string().date(),
});

export class GetCrmKpiSalesTargetDto extends createZodDto(
  GetCrmKpiSalesTargetSchema,
) {
  declare periodType: 'monthly';
  declare periodStart: string;
}
