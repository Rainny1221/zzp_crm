import { Query } from '@nestjs/cqrs';
import type {
  CrmPipelineTableSummary,
  PipelineDealRecordResponse,
} from './get-crm-pipeline-table.query';
import type { GetCrmPipelineKanbanQueryFilters } from './get-crm-pipeline-kanban.query';

export interface PipelineProductKanbanColumnResponse {
  productPackage: string;
  totalCount: number;
  totalValue: number;
  items: PipelineDealRecordResponse[];
}

export interface GetCrmPipelineProductKanbanQueryResult {
  columns: Record<string, PipelineProductKanbanColumnResponse>;
  summary: CrmPipelineTableSummary;
}

export class GetCrmPipelineProductKanbanQuery extends Query<GetCrmPipelineProductKanbanQueryResult> {
  constructor(public readonly filters: GetCrmPipelineKanbanQueryFilters) {
    super();
  }
}
