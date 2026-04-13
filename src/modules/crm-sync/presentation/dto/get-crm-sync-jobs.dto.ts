import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CRM_SYNC_JOB_STATUS_VALUES,
  type CrmSyncJobStatus,
} from '../../domain/crm-sync.constants';

export const GetCrmSyncJobsSchema = z.object({
  status: z.enum(CRM_SYNC_JOB_STATUS_VALUES).optional(),
  eventType: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class GetCrmSyncJobsDto extends createZodDto(GetCrmSyncJobsSchema) {
  declare status?: CrmSyncJobStatus;
  declare eventType?: string;
  declare page: number;
  declare limit: number;
}
