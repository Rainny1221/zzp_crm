import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalPositiveInt = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().int().min(1).optional(),
);

export const CrmFeedbackReadFilterSchema = z
  .enum(['all', 'read', 'unread'])
  .default('all');

export type CrmFeedbackReadFilter = z.infer<typeof CrmFeedbackReadFilterSchema>;

export const GetCrmFeedbackSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isRead: CrmFeedbackReadFilterSchema,
  category: z.string().trim().min(1).default('all'),
  customerId: optionalPositiveInt,
});

export class GetCrmFeedbackDto extends createZodDto(GetCrmFeedbackSchema) {
  declare page: number;
  declare limit: number;
  declare isRead: CrmFeedbackReadFilter;
  declare category: string;
  declare customerId: number | undefined;
}
