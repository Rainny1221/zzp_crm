import { createZodDto } from 'nestjs-zod';
import {
  GetCrmPipelineTableSchema,
  type CrmPipelineTableBooleanFilter,
  type CrmPipelineTableFocus,
} from './get-crm-pipeline-table.dto';

export const GetCrmPipelineKanbanSchema = GetCrmPipelineTableSchema.omit({
  page: true,
  limit: true,
  sortKey: true,
  sortDirection: true,
});

export class GetCrmPipelineKanbanDto extends createZodDto(
  GetCrmPipelineKanbanSchema,
) {
  declare search: string | undefined;
  declare pipelineStage: string;
  declare status: string;
  declare productPackage: string;
  declare tier: string;
  declare source: string;
  declare assignee: string;
  declare focus: CrmPipelineTableFocus;
  declare isActive: CrmPipelineTableBooleanFilter;
  declare isClosing: CrmPipelineTableBooleanFilter;
  declare isStuck: CrmPipelineTableBooleanFilter;
  declare minValue: number | undefined;
  declare maxValue: number | undefined;
  declare minRevenue: number | undefined;
  declare maxRevenue: number | undefined;
  declare minGmv: number | undefined;
  declare maxGmv: number | undefined;
  declare minProbability: number | undefined;
  declare maxProbability: number | undefined;
  declare minOpenTaskCount: number | undefined;
  declare maxOpenTaskCount: number | undefined;
  declare createdFrom: string | undefined;
  declare createdTo: string | undefined;
  declare lastActivityFrom: string | undefined;
  declare lastActivityTo: string | undefined;
  declare lastContactedFrom: string | undefined;
  declare lastContactedTo: string | undefined;
  declare stageTransitionFrom: string | undefined;
  declare stageTransitionTo: string | undefined;
  declare trialEndFrom: string | undefined;
  declare trialEndTo: string | undefined;
}
