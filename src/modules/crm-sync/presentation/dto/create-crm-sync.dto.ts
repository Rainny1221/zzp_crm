import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateCrmSyncSchema = z.object({
  id: z.number().int().positive(),
});

export class CreateCrmSyncDto extends createZodDto(CreateCrmSyncSchema) {}
