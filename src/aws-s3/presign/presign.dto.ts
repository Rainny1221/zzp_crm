import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PresignUploadSchema = z.object({
  contentType: z
    .string()
    .describe('Loại nội dung của file (content type)')
    .default('image/jpeg'),
  size: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024)
    .describe('Kích thước của file tính bằng byte'),
  fileName: z.string().optional().describe('Tên file (có thể để trống)'),
});

export class PresignUploadDto extends createZodDto(PresignUploadSchema) {}

export const PresignUploadResponseSchema = z.object({
  key: z.string(),
  uploadUrl: z.string(),
  expiresIn: z.number(),
  publicUrl: z.string(),
});

export class PresignUploadResponseDto extends createZodDto(
  PresignUploadResponseSchema,
) {}
