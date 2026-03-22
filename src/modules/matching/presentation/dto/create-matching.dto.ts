import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateMatchingSchema = z.object({
  // TODO: define Zod validation schema
});

export class CreateMatchingDto extends createZodDto(CreateMatchingSchema) {}
