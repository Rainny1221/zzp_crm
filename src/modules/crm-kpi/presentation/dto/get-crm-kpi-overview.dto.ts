import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetCrmKpiOverviewSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  source: z.string().trim().min(1).default('all'),
  assignee: z.string().trim().min(1).default('all'),
  stage: z.string().trim().min(1).default('all'),
  productPackage: z.string().trim().min(1).default('all'),
});

export class GetCrmKpiOverviewDto extends createZodDto(
  GetCrmKpiOverviewSchema,
) {
  declare from?: string;
  declare to?: string;
  declare source: string;
  declare assignee: string;
  declare stage: string;
  declare productPackage: string;
}
