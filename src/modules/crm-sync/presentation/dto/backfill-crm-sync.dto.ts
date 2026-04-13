import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BackfillCrmSyncSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

export class BackfillCrmSyncDto extends createZodDto(BackfillCrmSyncSchema) {
  declare limit: number;
}
