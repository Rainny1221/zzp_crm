import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateCrmSyncSchema = z.object({
  // TODO: define Zod validation schema
});

export class UpdateCrmSyncDto extends createZodDto(UpdateCrmSyncSchema) {}
