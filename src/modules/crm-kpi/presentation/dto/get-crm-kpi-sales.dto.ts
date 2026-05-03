import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetCrmKpiSalesSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  source: z.string().trim().min(1).default('all'),
});

export class GetCrmKpiSalesDto extends createZodDto(GetCrmKpiSalesSchema) {
  declare from?: string;
  declare to?: string;
  declare source: string;
}
