import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { Prisma } from 'src/generated/prisma/client';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import type { GetCrmCustomersQueryFilters } from '../../application/queries';

const CRM_CUSTOMERS_LOG = {
  MODULE: 'crm-customers',
  ACTIONS: {
    LIST_CUSTOMERS: 'CRM_CUSTOMERS_LIST',
  },
  ENTITIES: {
    CUSTOMER: 'CRM_CUSTOMER',
  },
} as const;

export type CrmCustomerListRow = {
  customerId: string;
  userId: number;
  dealId: string | null;
  shopName: string | null;
  tiktokLink: string | null;
  phone: string | null;
  email: string | null;
  gmvMonthly: number | null;
  industry: string | null;
  jobTitle: string | null;
  province: string | null;
  tierCode: string | null;
  sourceCode: string | null;
  partnerName: string | null;
  sourceNote: string | null;
  syncedAt: Date | null;
  customerCreatedAt: Date;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  assigneeAvatar: string | null;
  assigneeRole: string | null;
  statusCode: string | null;
  pipelineStageCode: string | null;
  trialStartAt: Date | null;
  trialEndAt: Date | null;
  revenue: number | null;
  dealValue: number | null;
  probability: number | null;
  productPackageCode: string | null;
  failureReasonCode: string | null;
  failureNote: string | null;
  lastContactedAt: Date | null;
  lastActivityAt: Date | null;
  openTaskCount: number;
  nextTaskId: string | null;
  nextTaskTitle: string | null;
  nextTaskDueAt: Date | null;
  nextTaskPriority: string | null;
};

type CountRow = {
  count: number;
};

export type FindCrmCustomersReadResult = {
  items: CrmCustomerListRow[];
  filteredCount: number;
  totalCount: number;
};

@Injectable()
export class CrmCustomersReadRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findCustomers(
    params: GetCrmCustomersQueryFilters,
  ): Promise<FindCrmCustomersReadResult> {
    const offset = params.page * params.limit;
    const whereSql = this.buildWhereSql(params);

    try {
      const [items, filteredCountRows, totalCountRows] = await Promise.all([
        this.prisma.$queryRaw<CrmCustomerListRow[]>(Prisma.sql`
          SELECT
            c.id::text AS "customerId",
            c.user_id AS "userId",
            d.id::text AS "dealId",
            cbp.shop_name AS "shopName",
            cbp.tiktok_link AS "tiktokLink",
            COALESCE(cbp.phone, profile_user.phone_number) AS "phone",
            COALESCE(cbp.email, profile_user.email) AS "email",
            COALESCE(c.gmv_monthly, cbp.gmv_monthly)::double precision AS "gmvMonthly",
            cbp.industry AS "industry",
            cbp.job_title AS "jobTitle",
            cbp.province AS "province",
            c.customer_tier_code AS "tierCode",
            c.source_code AS "sourceCode",
            cbp.partner_name AS "partnerName",
            cbp.source_note AS "sourceNote",
            cbp.synced_at AS "syncedAt",
            c.created_at AS "customerCreatedAt",
            d.owner_id AS "assigneeId",
            COALESCE(
              NULLIF(TRIM(CONCAT_WS(' ', owner.first_name, owner.last_name)), ''),
              owner.username,
              owner.email
            ) AS "assigneeName",
            owner.email AS "assigneeEmail",
            owner.avatar_name AS "assigneeAvatar",
            owner_role.name AS "assigneeRole",
            d.status AS "statusCode",
            d.pipeline_stage_code AS "pipelineStageCode",
            dd.trial_start_date AS "trialStartAt",
            dd.trial_end_date AS "trialEndAt",
            dd.closed_revenue::double precision AS "revenue",
            d.deal_value::double precision AS "dealValue",
            d.probability AS "probability",
            d.product_package_code AS "productPackageCode",
            dd.failure_reason_code AS "failureReasonCode",
            dd.failure_note AS "failureNote",
            dd.last_contacted_at AS "lastContactedAt",
            last_activity.last_activity_at AS "lastActivityAt",
            COALESCE(task_summary.open_task_count, 0)::int AS "openTaskCount",
            next_task.id::text AS "nextTaskId",
            next_task.title AS "nextTaskTitle",
            next_task.due_date AS "nextTaskDueAt",
            next_task.priority_code AS "nextTaskPriority"
          ${this.buildListFromSql()}
          ${whereSql}
          ORDER BY COALESCE(
            last_activity.last_activity_at,
            dd.last_contacted_at,
            c.created_at
          ) DESC NULLS LAST, c.id DESC
          LIMIT ${params.limit}
          OFFSET ${offset}
        `),
        this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
          SELECT COUNT(*)::int AS "count"
          ${this.buildBaseFromSql()}
          ${whereSql}
        `),
        this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
          SELECT COUNT(*)::int AS "count"
          ${this.buildBaseFromSql()}
        `),
      ]);

      const filteredCount = filteredCountRows[0]?.count ?? 0;
      const totalCount = totalCountRows[0]?.count ?? 0;

      this.logger.debug({
        message: 'CRM customers listed',
        context: CrmCustomersReadRepository.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.LIST_CUSTOMERS,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        meta: {
          filters: params,
          filteredCount,
          totalCount,
          itemCount: items.length,
        },
      });

      return {
        items,
        filteredCount,
        totalCount,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to list CRM customers',
        context: CrmCustomersReadRepository.name,
        module: CRM_CUSTOMERS_LOG.MODULE,
        action: CRM_CUSTOMERS_LOG.ACTIONS.LIST_CUSTOMERS,
        entityType: CRM_CUSTOMERS_LOG.ENTITIES.CUSTOMER,
        meta: {
          filters: params,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to list CRM customers',
        {
          filters: params,
          error: toErrorMeta(error),
        },
      );
    }
  }

  private buildBaseFromSql(): Prisma.Sql {
    return Prisma.sql`
      FROM crm_customer_profiles c
      JOIN crm_deals d ON d.customer_id = c.id
      LEFT JOIN crm_customer_business_profiles cbp ON cbp.customer_id = c.id
      LEFT JOIN crm_deal_details dd ON dd.deal_id = d.id
      LEFT JOIN users profile_user ON profile_user.id = c.user_id
      LEFT JOIN users owner ON owner.id = d.owner_id
      LEFT JOIN roles owner_role ON owner_role.id = owner.role_id
    `;
  }

  private buildListFromSql(): Prisma.Sql {
    return Prisma.sql`
      ${this.buildBaseFromSql()}
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS open_task_count
        FROM crm_tasks task_count
        WHERE task_count.customer_id = c.id
          AND task_count.completed = false
      ) task_summary ON true
      LEFT JOIN LATERAL (
        SELECT task.id, task.title, task.due_date, task.priority_code
        FROM crm_tasks task
        WHERE task.customer_id = c.id
          AND task.completed = false
        ORDER BY task.due_date ASC, task.id ASC
        LIMIT 1
      ) next_task ON true
      LEFT JOIN LATERAL (
        SELECT MAX(activity.occurred_at) AS last_activity_at
        FROM crm_activities activity
        WHERE activity.customer_id = c.id
      ) last_activity ON true
    `;
  }

  private buildWhereSql(params: GetCrmCustomersQueryFilters): Prisma.Sql {
    const where: Prisma.Sql[] = [];

    if (params.search) {
      const pattern = `%${params.search}%`;

      where.push(Prisma.sql`
        (
          cbp.shop_name ILIKE ${pattern}
          OR cbp.phone ILIKE ${pattern}
          OR cbp.email ILIKE ${pattern}
          OR cbp.tiktok_link ILIKE ${pattern}
          OR cbp.partner_name ILIKE ${pattern}
          OR cbp.source_note ILIKE ${pattern}
          OR profile_user.email ILIKE ${pattern}
          OR profile_user.phone_number ILIKE ${pattern}
          OR profile_user.username ILIKE ${pattern}
        )
      `);
    }

    if (params.tier !== 'all') {
      where.push(Prisma.sql`c.customer_tier_code = ${params.tier}`);
    }

    if (params.status !== 'all') {
      where.push(this.buildStatusFilterSql(params.status));
    }

    if (params.source !== 'all') {
      where.push(Prisma.sql`c.source_code = ${params.source}`);
    }

    if (params.assignee === 'unassigned') {
      where.push(Prisma.sql`d.owner_id IS NULL`);
    } else if (params.assignee !== 'all') {
      where.push(Prisma.sql`d.owner_id = ${Number(params.assignee)}`);
    }

    if (params.focus === 'unassigned_leads') {
      where.push(Prisma.sql`
        d.owner_id IS NULL
        AND UPPER(COALESCE(d.status, '')) IN ('NEW')
      `);
    }

    if (!where.length) {
      return Prisma.empty;
    }

    return Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`;
  }

  private buildStatusFilterSql(
    status: GetCrmCustomersQueryFilters['status'],
  ): Prisma.Sql {
    switch (status) {
      case 'new':
        return Prisma.sql`UPPER(COALESCE(d.status, '')) IN ('NEW')`;
      case 'trial':
        return Prisma.sql`LOWER(COALESCE(d.status, '')) = 'trial'`;
      case 'success':
        return Prisma.sql`UPPER(COALESCE(d.status, '')) IN ('SUCCESS', 'WON')`;
      case 'failed':
        return Prisma.sql`UPPER(COALESCE(d.status, '')) IN ('FAILED', 'FAIL', 'LOST')`;
      case 'all':
        return Prisma.empty;
    }
  }
}
