import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'must be a valid date or datetime',
  });

export const GetCrmDashboardSalesSchema = z.object({
  from: optionalDate,
  to: optionalDate,
  source: z.string().trim().min(1).default('all'),
});

export class GetCrmDashboardSalesDto extends createZodDto(
  GetCrmDashboardSalesSchema,
) {
  declare from: string | undefined;
  declare to: string | undefined;
  declare source: string;
}
