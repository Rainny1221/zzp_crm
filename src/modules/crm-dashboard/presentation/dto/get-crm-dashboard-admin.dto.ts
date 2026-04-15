import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'must be a valid date or datetime',
  });

export const GetCrmDashboardAdminSchema = z.object({
  from: optionalDate,
  to: optionalDate,
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
  source: z.string().trim().min(1).default('all'),
});

export class GetCrmDashboardAdminDto extends createZodDto(
  GetCrmDashboardAdminSchema,
) {
  declare from: string | undefined;
  declare to: string | undefined;
  declare assignee: string;
  declare source: string;
}
