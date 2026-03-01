import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ConfirmUploadSchema = z.object({
  key: z.string().describe('Key của file đã upload lên S3'),
});

export class ConfirmUploadDto extends createZodDto(ConfirmUploadSchema) {}

export const ConfirmUploadResponseSchema = z.object({
  key: z.string(),
  publicUrl: z.string(),
  contentType: z.string(),
  size: z.number(),
});

export class ConfirmUploadResponseDto extends createZodDto(ConfirmUploadResponseSchema) {}