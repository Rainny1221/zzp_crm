import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CRM_PIPELINE_STAGE_CODES,
  type CrmPipelineStageCode,
} from '../../domain/crm-customers.constants';

export const UpdateCrmCustomerPipelineStageSchema = z.object({
  pipelineStage: z.enum(CRM_PIPELINE_STAGE_CODES),
  note: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value ? value : undefined)),
  failureReason: z.string().trim().max(100).nullable().optional(),
  failureNote: z.string().trim().max(1000).nullable().optional(),
});

export class UpdateCrmCustomerPipelineStageDto extends createZodDto(
  UpdateCrmCustomerPipelineStageSchema,
) {
  declare pipelineStage: CrmPipelineStageCode;
  declare note: string | undefined;
  declare failureReason: string | null | undefined;
  declare failureNote: string | null | undefined;
}
