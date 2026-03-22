import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateMatchingSchema = z.object({
  // TODO: define Zod validation schema
});

export class UpdateMatchingDto extends createZodDto(UpdateMatchingSchema) {}
