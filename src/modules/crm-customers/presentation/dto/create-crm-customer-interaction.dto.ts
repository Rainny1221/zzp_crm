import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CRM_INTERACTION_CHANNEL_CODES,
  type CrmInteractionChannelCode,
} from '../../domain/crm-customers.constants';

export const CreateCrmCustomerInteractionSchema = z.object({
  channel: z.enum(CRM_INTERACTION_CHANNEL_CODES),
  outcomeCode: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(1).max(2000),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export class CreateCrmCustomerInteractionDto extends createZodDto(
  CreateCrmCustomerInteractionSchema,
) {
  declare channel: CrmInteractionChannelCode;
  declare outcomeCode: string;
  declare summary: string;
  declare occurredAt: string | undefined;
}
