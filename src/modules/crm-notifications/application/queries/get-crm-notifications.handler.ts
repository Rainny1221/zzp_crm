import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CrmNotificationsReadRepository } from '../../infrastructure/repositories/crm-notifications-read.repository';
import { GetCrmNotificationsQuery } from './get-crm-notifications.query';

@QueryHandler(GetCrmNotificationsQuery)
export class GetCrmNotificationsHandler implements IQueryHandler<
  GetCrmNotificationsQuery,
  any
> {
  constructor(private readonly repository: CrmNotificationsReadRepository) {}

  async execute(query: GetCrmNotificationsQuery) {
    const result = await this.repository.findNotifications(query.filters);

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
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
