import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalPositiveInt = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().int().min(1).optional(),
);

export const CrmNotificationReadFilterSchema = z
  .enum(['all', 'read', 'unread'])
  .default('all');

export type CrmNotificationReadFilter = z.infer<
  typeof CrmNotificationReadFilterSchema
>;

export const GetCrmNotificationsSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isRead: CrmNotificationReadFilterSchema,
  type: z.string().trim().min(1).default('all'),
  customerId: optionalPositiveInt,
});

export class GetCrmNotificationsDto extends createZodDto(
  GetCrmNotificationsSchema,
) {
  declare page: number;
  declare limit: number;
  declare isRead: CrmNotificationReadFilter;
  declare type: string;
  declare customerId: number | undefined;
}
