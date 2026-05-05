import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CRM_PIPELINE_STAGE_CODES,
  CRM_PRODUCT_PACKAGE_CODES,
  type CrmPipelineStageCode,
} from '../../domain/crm-customers.constants';

export const UpdateCrmCustomerPipelineStageSchema = z
  .object({
    pipelineStage: z.enum(CRM_PIPELINE_STAGE_CODES),
    note: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((value) => (value ? value : undefined)),
    failureReason: z.string().trim().max(100).nullable().optional(),
    failureNote: z.string().trim().max(1000).nullable().optional(),
    productPackage: z.enum(CRM_PRODUCT_PACKAGE_CODES).optional(),
    finalContractValue: z.number().nonnegative().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.pipelineStage === 'close_deal') {
      if (!value.productPackage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'productPackage là bắt buộc khi chốt deal',
          path: ['productPackage'],
        });
      }
      if (value.finalContractValue == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'finalContractValue là bắt buộc khi chốt deal',
          path: ['finalContractValue'],
        });
      }
    }

    if (
      (value.pipelineStage === 'fail' ||
        value.pipelineStage === 'lost' ||
        value.pipelineStage === 'lost_unqualified') &&
      !value.failureReason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'failureReason là bắt buộc khi chuyển sang fail/lost',
        path: ['failureReason'],
      });
    }
  });

export class UpdateCrmCustomerPipelineStageDto extends createZodDto(
  UpdateCrmCustomerPipelineStageSchema,
) {
  declare pipelineStage: CrmPipelineStageCode;
  declare note: string | undefined;
  declare failureReason: string | null | undefined;
  declare failureNote: string | null | undefined;
  declare productPackage: 'trial' | '499' | '699' | undefined;
  declare finalContractValue: number | undefined;
}
