import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { GetCrmNotificationsFilters } from '../../application/queries';

export type CrmNotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  customerId: string | null;
  dealId: string | null;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  payload: Prisma.JsonValue | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class CrmNotificationsReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNotifications(filters: GetCrmNotificationsFilters) {
    const where = this.buildWhere(filters);
    const offset = filters.page * filters.limit;

    const rows = await this.prisma.$queryRaw<CrmNotificationRow[]>(
      Prisma.sql`
        SELECT
          n.id::text AS "id",
          n.type_code AS "type",
          n.title AS "title",
          n.message AS "message",
          n.customer_id::text AS "customerId",
          n.deal_id::text AS "dealId",
          n.actor_user_id::text AS "actorId",
          COALESCE(
            NULLIF(TRIM(CONCAT_WS(' ', actor.first_name, actor.last_name)), ''),
            actor.username,
            actor.email
          ) AS "actorName",
          actor.email AS "actorEmail",
          n.payload AS "payload",
          n.is_read AS "isRead",
          n.read_at AS "readAt",
          n.created_at AS "createdAt"
        FROM crm_notifications n
        LEFT JOIN users actor ON actor.id = n.actor_user_id
        ${where}
        ORDER BY n.created_at DESC, n.id DESC
        OFFSET ${offset}
        LIMIT ${filters.limit}
      `,
    );

    const [totalRow, unreadRow] = await Promise.all([
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM crm_notifications n
        ${where}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM crm_notifications n
        WHERE n.receiver_user_id = ${filters.receiverUserId}
          AND n.is_read = false
      `),
    ]);

    const total = Number(totalRow[0]?.total ?? 0);
    const unreadCount = Number(unreadRow[0]?.total ?? 0);

    return {
      rows,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pageCount: Math.ceil(total / filters.limit),
      },
      summary: {
        unreadCount,
        totalCount: total,
      },
    };
  }

  private buildWhere(filters: GetCrmNotificationsFilters): Prisma.Sql {
    const where: Prisma.Sql[] = [
      Prisma.sql`n.receiver_user_id = ${filters.receiverUserId}`,
    ];

    if (filters.isRead === 'read') {
      where.push(Prisma.sql`n.is_read = true`);
    }

    if (filters.isRead === 'unread') {
      where.push(Prisma.sql`n.is_read = false`);
    }

    if (filters.type !== 'all') {
      where.push(Prisma.sql`n.type_code = ${filters.type}`);
    }

    if (filters.customerId != null) {
      where.push(Prisma.sql`n.customer_id = ${filters.customerId}`);
    }

    return Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`;
  }
}
