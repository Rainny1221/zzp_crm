import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { GetCrmFeedbackFilters } from '../../application/queries';

export type CrmFeedbackRow = {
  id: string;
  category: string;
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
export class CrmFeedbackReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFeedback(filters: GetCrmFeedbackFilters) {
    const where = this.buildWhere(filters);
    const offset = filters.page * filters.limit;

    const rows = await this.prisma.$queryRaw<CrmFeedbackRow[]>(Prisma.sql`
      SELECT
        f.id::text AS "id",
        f.category_code AS "category",
        f.title AS "title",
        f.message AS "message",
        f.customer_id::text AS "customerId",
        f.deal_id::text AS "dealId",
        f.actor_user_id::text AS "actorId",
        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', actor.first_name, actor.last_name)), ''),
          actor.username,
          actor.email
        ) AS "actorName",
        actor.email AS "actorEmail",
        f.payload AS "payload",
        f.is_read AS "isRead",
        f.read_at AS "readAt",
        f.created_at AS "createdAt"
      FROM crm_feedback f
      LEFT JOIN users actor ON actor.id = f.actor_user_id
      ${where}
      ORDER BY f.created_at DESC, f.id DESC
      OFFSET ${offset}
      LIMIT ${filters.limit}
    `);

    const [totalRow, unreadRow] = await Promise.all([
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM crm_feedback f
        ${where}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM crm_feedback f
        WHERE f.receiver_user_id = ${filters.receiverUserId}
          AND f.is_read = false
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

  private buildWhere(filters: GetCrmFeedbackFilters): Prisma.Sql {
    const where: Prisma.Sql[] = [
      Prisma.sql`f.receiver_user_id = ${filters.receiverUserId}`,
    ];

    if (filters.isRead === 'read') {
      where.push(Prisma.sql`f.is_read = true`);
    }

    if (filters.isRead === 'unread') {
      where.push(Prisma.sql`f.is_read = false`);
    }

    if (filters.category !== 'all') {
      where.push(Prisma.sql`f.category_code = ${filters.category}`);
    }

    if (filters.customerId != null) {
      where.push(Prisma.sql`f.customer_id = ${filters.customerId}`);
    }

    return Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`;
  }
}
