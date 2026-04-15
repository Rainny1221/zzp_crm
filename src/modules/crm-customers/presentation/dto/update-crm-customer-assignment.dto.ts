import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCrmCustomerAssignmentSchema = z.object({
  assigneeId: z.coerce.number().int().min(1).nullable(),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export class UpdateCrmCustomerAssignmentDto extends createZodDto(
  UpdateCrmCustomerAssignmentSchema,
) {
  declare assigneeId: number | null;
  declare note: string | undefined;
}
