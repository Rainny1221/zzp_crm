import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CrmFeedbackReadRepository } from '../../infrastructure/repositories/crm-feedback-read.repository';
import { GetCrmFeedbackQuery } from './get-crm-feedback.query';

@QueryHandler(GetCrmFeedbackQuery)
export class GetCrmFeedbackHandler implements IQueryHandler<
  GetCrmFeedbackQuery,
  any
> {
  constructor(private readonly repository: CrmFeedbackReadRepository) {}

  async execute(query: GetCrmFeedbackQuery) {
    const result = await this.repository.findFeedback(query.filters);

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        message: row.message,
        customerId: row.customerId,
        dealId: row.dealId,
        actor: row.actorId
          ? {
              id: row.actorId,
              name: row.actorName,
              email: row.actorEmail,
            }
          : null,
        payload: row.payload,
        isRead: row.isRead,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: result.pagination,
      summary: result.summary,
    };
  }
}
