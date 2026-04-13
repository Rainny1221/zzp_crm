import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProcessCrmSyncJobSchema = z.object({
  jobId: z.number().int().positive(),
});

export class ProcessCrmSyncJobDto extends createZodDto(
  ProcessCrmSyncJobSchema,
) {
  declare jobId: number;
}
