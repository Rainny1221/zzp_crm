import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCrmCustomerNoteSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export class CreateCrmCustomerNoteDto extends createZodDto(
  CreateCrmCustomerNoteSchema,
) {
  declare content: string;
}
