import { Query } from '@nestjs/cqrs';
import type {
  CrmPipelineTableSummary,
  GetCrmPipelineTableQueryFilters,
  PipelineDealRecordResponse,
} from './get-crm-pipeline-table.query';

export type GetCrmPipelineKanbanQueryFilters = Omit<
  GetCrmPipelineTableQueryFilters,
  'page' | 'limit' | 'sortKey' | 'sortDirection'
>;

export interface PipelineKanbanColumnResponse {
  pipelineStage: string;
  totalCount: number;
  totalValue: number;
  items: PipelineDealRecordResponse[];
}

export interface GetCrmPipelineKanbanQueryResult {
  columns: Record<string, PipelineKanbanColumnResponse>;
  summary: CrmPipelineTableSummary;
}

export class GetCrmPipelineKanbanQuery extends Query<GetCrmPipelineKanbanQueryResult> {
  constructor(public readonly filters: GetCrmPipelineKanbanQueryFilters) {
    super();
  }
}
