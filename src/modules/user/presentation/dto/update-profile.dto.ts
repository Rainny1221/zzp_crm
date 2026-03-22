import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone_number: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().min(5, 'Địa chỉ quá ngắn').optional(),
  age: z.number().int().positive('Tuổi phải là số nguyên dương'),
  bio: z.string().max(500, 'Tiểu sử không được vượt quá 500 ký tự').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  hobby: z.string().optional(),
  major: z.string().optional(),
  avatar: z.record(z.string(), z.any()).optional(),
  hobby_ids: z.array(z.number()).optional(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
