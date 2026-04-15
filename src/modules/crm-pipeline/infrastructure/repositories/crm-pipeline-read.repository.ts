import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { Prisma } from 'src/generated/prisma/client';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import type {
  CrmPipelineTableSummary,
  GetCrmPipelineKanbanQueryFilters,
  GetCrmPipelineTableQueryFilters,
} from '../../application/queries';
import { CRM_PIPELINE_LOG } from '../../domain/crm-pipeline.constants';

type CountRow = {
  count: number;
};

type SummaryRow = CrmPipelineTableSummary;
type CrmPipelineFilterParams = Omit<
  GetCrmPipelineTableQueryFilters,
  'page' | 'limit' | 'sortKey' | 'sortDirection'
>;

export type CrmPipelineStageRow = {
  code: string;
};

export type CrmPipelineProductPackageRow = {
  code: string;
};

export type CrmPipelineTableRow = {
  dealId: string;
  customerId: string;
  userId: number;
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
  pipelineStageCode: string;
  trialStartAt: Date | null;
  trialEndAt: Date | null;
  revenue: number | null;
  dealValue: number | null;
  probability: number;
  productPackageCode: string | null;
  failureReasonCode: string | null;
  failureNote: string | null;
  lastContactedAt: Date | null;
  lastActivityAt: Date | null;
  openTaskCount: number;
  stageTransitionAt: Date | null;
  commission: number;
};

export type FindCrmPipelineTableResult = {
  rows: CrmPipelineTableRow[];
  total: number;
  summary: CrmPipelineTableSummary;
};

export type FindCrmPipelineKanbanByStageResult = {
  stages: CrmPipelineStageRow[];
  rows: CrmPipelineTableRow[];
  summary: CrmPipelineTableSummary;
};

export type FindCrmPipelineKanbanByProductPackageResult = {
  productPackages: CrmPipelineProductPackageRow[];
  rows: CrmPipelineTableRow[];
  summary: CrmPipelineTableSummary;
};

@Injectable()
export class CrmPipelineReadRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findTable(
    params: GetCrmPipelineTableQueryFilters,
  ): Promise<FindCrmPipelineTableResult> {
    const offset = params.page * params.limit;
    const whereSql = this.buildWhereSql(params);
    const baseSql = this.buildBaseSql(whereSql);

    try {
      const [rows, countRows, summary] = await Promise.all([
        this.prisma.$queryRaw<CrmPipelineTableRow[]>(Prisma.sql`
          WITH base AS (
            ${baseSql}
          )
          SELECT *
          FROM base
          ORDER BY ${this.buildOrderBySql(params)}
          LIMIT ${params.limit}
          OFFSET ${offset}
        `),
        this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
          WITH base AS (
            ${baseSql}
          )
          SELECT COUNT(*)::int AS "count"
          FROM base
        `),
        this.loadSummary(baseSql),
      ]);

      const total = countRows[0]?.count ?? 0;

      this.logger.debug({
        message: 'CRM pipeline table loaded',
        context: CrmPipelineReadRepository.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_TABLE,
        entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
        meta: {
          filters: params,
          total,
          rowCount: rows.length,
        },
      });

      return {
        rows,
        total,
        summary,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to load CRM pipeline table',
        context: CrmPipelineReadRepository.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_TABLE,
        entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
        meta: {
          filters: params,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to load CRM pipeline table',
        {
          filters: params,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async findKanbanByStage(
    params: GetCrmPipelineKanbanQueryFilters,
  ): Promise<FindCrmPipelineKanbanByStageResult> {
    const whereSql = this.buildWhereSql(params);
    const baseSql = this.buildBaseSql(whereSql);

    try {
      const [stages, rows, summary] = await Promise.all([
        this.prisma.crmPipelineStages.findMany({
          where: { is_active: true },
          orderBy: { stage_order: 'asc' },
          select: { code: true },
        }),
        this.prisma.$queryRaw<CrmPipelineTableRow[]>(Prisma.sql`
          WITH base AS (
            ${baseSql}
          )
          SELECT *
          FROM base
          ORDER BY
            "stageTransitionAt" DESC NULLS LAST,
            "lastActivityAt" DESC NULLS LAST,
            "dealValue" DESC NULLS LAST,
            "dealId" ASC
        `),
        this.loadSummary(baseSql),
      ]);

      this.logger.debug({
        message: 'CRM pipeline kanban loaded',
        context: CrmPipelineReadRepository.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_KANBAN,
        entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
        meta: {
          filters: params,
          stageCount: stages.length,
          rowCount: rows.length,
        },
      });

      return {
        stages,
        rows,
        summary,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to load CRM pipeline kanban',
        context: CrmPipelineReadRepository.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_KANBAN,
        entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
        meta: {
          filters: params,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to load CRM pipeline kanban',
        {
          filters: params,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async findKanbanByProductPackage(
    params: GetCrmPipelineKanbanQueryFilters,
  ): Promise<FindCrmPipelineKanbanByProductPackageResult> {
    const whereSql = this.buildWhereSql(params);
    const baseSql = this.buildBaseSql(whereSql);

    try {
      const [productPackages, rows, summary] = await Promise.all([
        this.prisma.crmProductPackages.findMany({
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
          select: { code: true },
        }),
        this.prisma.$queryRaw<CrmPipelineTableRow[]>(Prisma.sql`
          WITH base AS (
            ${baseSql}
          )
          SELECT *
          FROM base
          ORDER BY
            "productPackageCode" ASC NULLS LAST,
            "lastActivityAt" DESC NULLS LAST,
            "stageTransitionAt" DESC NULLS LAST,
            "dealValue" DESC NULLS LAST,
            "dealId" ASC
        `),
        this.loadSummary(baseSql),
      ]);

      this.logger.debug({
        message: 'CRM pipeline product kanban loaded',
        context: CrmPipelineReadRepository.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_PRODUCT_KANBAN,
        entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
        meta: {
          filters: params,
          productPackageCount: productPackages.length,
          rowCount: rows.length,
        },
      });

      return {
        productPackages,
        rows,
        summary,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to load CRM pipeline product kanban',
        context: CrmPipelineReadRepository.name,
        module: CRM_PIPELINE_LOG.MODULE,
        action: CRM_PIPELINE_LOG.ACTIONS.GET_PRODUCT_KANBAN,
        entityType: CRM_PIPELINE_LOG.ENTITIES.DEAL,
        meta: {
          filters: params,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to load CRM pipeline product kanban',
        {
          filters: params,
          error: toErrorMeta(error),
        },
      );
    }
  }

  private async loadSummary(
    baseSql: Prisma.Sql,
  ): Promise<CrmPipelineTableSummary> {
    const rows = await this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        COUNT(*) FILTER (
          WHERE COALESCE("statusCode", 'new') NOT IN ('success', 'failed')
        )::int AS "progressingDeals",
        COUNT(*) FILTER (
          WHERE ${this.buildBaseStuckConditionSql()}
        )::int AS "stuckDeals",
        COUNT(*) FILTER (
          WHERE "pipelineStageCode" IN ('negotiation', 'close_deal')
        )::int AS "closingDeals",
        COALESCE(SUM(COALESCE("dealValue", 0)), 0)::double precision
          AS "totalPipelineValue",
        COALESCE(SUM(COALESCE("dealValue", 0)) FILTER (
          WHERE "statusCode" = 'success'
        ), 0)::double precision AS "wonValue",
        COUNT(*) FILTER (
          WHERE "statusCode" = 'failed'
        )::int AS "lostDeals",
        COUNT(*) FILTER (
          WHERE "trialEndAt" >= now()
            AND "trialEndAt" <= now() + interval '7 days'
        )::int AS "trialsExpiringSoon",
        COALESCE(SUM(COALESCE("commission", 0)), 0)::double precision
          AS "totalCommission"
      FROM base
    `);

    return rows[0] ?? this.getEmptySummary();
  }

  private buildBaseSql(whereSql: Prisma.Sql): Prisma.Sql {
    return Prisma.sql`
      SELECT
        d.id::text AS "dealId",
        c.id::text AS "customerId",
        c.user_id AS "userId",
        cbp.shop_name AS "shopName",
        cbp.tiktok_link AS "tiktokLink",
        COALESCE(cbp.phone, profile_user.phone_number) AS "phone",
        COALESCE(cbp.email, profile_user.email) AS "email",
        COALESCE(c.gmv_monthly, cbp.gmv_monthly)::double precision
          AS "gmvMonthly",
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
        stage_transition.stage_transition_at AS "stageTransitionAt",
        COALESCE(payment_summary.commission, 0)::double precision AS "commission"
      ${this.buildFromSql()}
      ${whereSql}
    `;
  }

  private buildFromSql(): Prisma.Sql {
    return Prisma.sql`
      FROM crm_deals d
      JOIN crm_customer_profiles c ON c.id = d.customer_id
      LEFT JOIN crm_customer_business_profiles cbp ON cbp.customer_id = c.id
      LEFT JOIN crm_deal_details dd ON dd.deal_id = d.id
      LEFT JOIN users profile_user ON profile_user.id = c.user_id
      LEFT JOIN users owner ON owner.id = d.owner_id
      LEFT JOIN roles owner_role ON owner_role.id = owner.role_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS open_task_count
        FROM crm_tasks task_count
        WHERE task_count.customer_id = c.id
          AND task_count.completed = false
      ) task_summary ON true
      LEFT JOIN LATERAL (
        SELECT MAX(activity.occurred_at) AS last_activity_at
        FROM crm_activities activity
        WHERE activity.customer_id = c.id
      ) last_activity ON true
      LEFT JOIN LATERAL (
        SELECT MAX(record.created_at) AS stage_transition_at
        FROM crm_pipeline_records record
        WHERE record.deal_id = d.id
          AND record.stage_code = d.pipeline_stage_code
      ) stage_transition ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(payment.sales_commission), 0)::double precision
          AS commission
        FROM crm_deal_details detail_for_payment
        JOIN crm_deal_payments payment
          ON payment.deal_detail_id = detail_for_payment.id
        WHERE detail_for_payment.deal_id = d.id
      ) payment_summary ON true
    `;
  }

  private buildWhereSql(params: CrmPipelineFilterParams): Prisma.Sql {
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

    if (params.pipelineStage !== 'all') {
      where.push(Prisma.sql`d.pipeline_stage_code = ${params.pipelineStage}`);
    }

    if (params.status !== 'all') {
      where.push(Prisma.sql`d.status = ${params.status}`);
    }

    if (params.productPackage !== 'all') {
      where.push(Prisma.sql`d.product_package_code = ${params.productPackage}`);
    }

    if (params.tier !== 'all') {
      where.push(Prisma.sql`c.customer_tier_code = ${params.tier}`);
    }

    if (params.source !== 'all') {
      where.push(Prisma.sql`c.source_code = ${params.source}`);
    }

    if (params.assignee === 'unassigned') {
      where.push(Prisma.sql`d.owner_id IS NULL`);
    } else if (params.assignee !== 'all') {
      where.push(Prisma.sql`d.owner_id = ${Number(params.assignee)}`);
    }

    if (params.minValue !== undefined) {
      where.push(Prisma.sql`COALESCE(d.deal_value, 0) >= ${params.minValue}`);
    }

    if (params.maxValue !== undefined) {
      where.push(Prisma.sql`COALESCE(d.deal_value, 0) <= ${params.maxValue}`);
    }

    if (params.minRevenue !== undefined) {
      where.push(
        Prisma.sql`COALESCE(dd.closed_revenue, 0) >= ${params.minRevenue}`,
      );
    }

    if (params.maxRevenue !== undefined) {
      where.push(
        Prisma.sql`COALESCE(dd.closed_revenue, 0) <= ${params.maxRevenue}`,
      );
    }

    if (params.minGmv !== undefined) {
      where.push(
        Prisma.sql`COALESCE(c.gmv_monthly, cbp.gmv_monthly, 0) >= ${params.minGmv}`,
      );
    }

    if (params.maxGmv !== undefined) {
      where.push(
        Prisma.sql`COALESCE(c.gmv_monthly, cbp.gmv_monthly, 0) <= ${params.maxGmv}`,
      );
    }

    if (params.minProbability !== undefined) {
      where.push(Prisma.sql`d.probability >= ${params.minProbability}`);
    }

    if (params.maxProbability !== undefined) {
      where.push(Prisma.sql`d.probability <= ${params.maxProbability}`);
    }

    if (params.minOpenTaskCount !== undefined) {
      where.push(
        Prisma.sql`COALESCE(task_summary.open_task_count, 0) >= ${params.minOpenTaskCount}`,
      );
    }

    if (params.maxOpenTaskCount !== undefined) {
      where.push(
        Prisma.sql`COALESCE(task_summary.open_task_count, 0) <= ${params.maxOpenTaskCount}`,
      );
    }

    this.pushDateRangeFilter(where, 'c.created_at', {
      from: params.createdFrom,
      to: params.createdTo,
    });
    this.pushDateRangeFilter(
      where,
      'COALESCE(last_activity.last_activity_at, dd.last_contacted_at, c.created_at)',
      {
        from: params.lastActivityFrom,
        to: params.lastActivityTo,
      },
    );
    this.pushDateRangeFilter(where, 'dd.last_contacted_at', {
      from: params.lastContactedFrom,
      to: params.lastContactedTo,
    });
    this.pushDateRangeFilter(where, 'stage_transition.stage_transition_at', {
      from: params.stageTransitionFrom,
      to: params.stageTransitionTo,
    });
    this.pushDateRangeFilter(where, 'dd.trial_end_date', {
      from: params.trialEndFrom,
      to: params.trialEndTo,
    });

    this.pushBooleanFilter(where, params.isActive, {
      truthy: Prisma.sql`COALESCE(d.status, 'new') NOT IN ('success', 'failed')`,
      falsy: Prisma.sql`COALESCE(d.status, 'new') IN ('success', 'failed')`,
    });
    this.pushBooleanFilter(where, params.isClosing, {
      truthy: Prisma.sql`d.pipeline_stage_code IN ('negotiation', 'close_deal')`,
      falsy: Prisma.sql`d.pipeline_stage_code NOT IN ('negotiation', 'close_deal')`,
    });
    this.pushBooleanFilter(where, params.isStuck, {
      truthy: this.buildSourceStuckConditionSql(),
      falsy: Prisma.sql`NOT (${this.buildSourceStuckConditionSql()})`,
    });

    switch (params.focus) {
      case 'closing':
        where.push(Prisma.sql`
          d.pipeline_stage_code IN ('negotiation', 'close_deal')
        `);
        break;
      case 'stuck':
        where.push(this.buildSourceStuckConditionSql());
        break;
      case 'expiring':
        where.push(Prisma.sql`
          dd.trial_end_date >= now()
          AND dd.trial_end_date <= now() + interval '7 days'
        `);
        break;
      case 'all':
        break;
    }

    if (!where.length) {
      return Prisma.empty;
    }

    return Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`;
  }

  private pushDateRangeFilter(
    where: Prisma.Sql[],
    expression: string,
    range: {
      from?: string;
      to?: string;
    },
  ): void {
    if (range.from) {
      where.push(
        Prisma.sql`${Prisma.raw(expression)} >= ${new Date(range.from)}`,
      );
    }

    if (range.to) {
      where.push(
        Prisma.sql`${Prisma.raw(expression)} <= ${new Date(range.to)}`,
      );
    }
  }

  private pushBooleanFilter(
    where: Prisma.Sql[],
    value: GetCrmPipelineTableQueryFilters['isActive'],
    conditions: {
      truthy: Prisma.Sql;
      falsy: Prisma.Sql;
    },
  ): void {
    if (value === 'true') {
      where.push(conditions.truthy);
    }

    if (value === 'false') {
      where.push(conditions.falsy);
    }
  }

  private buildSourceStuckConditionSql(): Prisma.Sql {
    return Prisma.sql`
      COALESCE(d.status, 'new') NOT IN ('success', 'failed')
      AND COALESCE(
        last_activity.last_activity_at,
        dd.last_contacted_at,
        stage_transition.stage_transition_at,
        c.created_at
      ) < now() - interval '7 days'
    `;
  }

  private buildBaseStuckConditionSql(): Prisma.Sql {
    return Prisma.sql`
      COALESCE("statusCode", 'new') NOT IN ('success', 'failed')
      AND COALESCE(
        "lastActivityAt",
        "lastContactedAt",
        "stageTransitionAt",
        "customerCreatedAt"
      ) < now() - interval '7 days'
    `;
  }

  private buildOrderBySql(params: GetCrmPipelineTableQueryFilters): Prisma.Sql {
    const direction =
      params.sortDirection === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const expression = this.getSortExpressionSql(params.sortKey);

    return Prisma.sql`${expression} ${direction} NULLS LAST, "dealId" ASC`;
  }

  private getSortExpressionSql(
    sortKey: GetCrmPipelineTableQueryFilters['sortKey'],
  ): Prisma.Sql {
    switch (sortKey) {
      case 'lastActivityAt':
        return Prisma.sql`"lastActivityAt"`;
      case 'stageTransitionAt':
        return Prisma.sql`"stageTransitionAt"`;
      case 'createdAt':
        return Prisma.sql`"customerCreatedAt"`;
      case 'probability':
        return Prisma.sql`"probability"`;
      case 'revenue':
        return Prisma.sql`"revenue"`;
      case 'gmvMonthly':
        return Prisma.sql`"gmvMonthly"`;
      case 'shopName':
        return Prisma.sql`"shopName"`;
      case 'status':
        return Prisma.sql`"statusCode"`;
      case 'pipelineStage':
        return Prisma.sql`"pipelineStageCode"`;
      case 'productPackage':
        return Prisma.sql`"productPackageCode"`;
      case 'owner':
        return Prisma.sql`"assigneeName"`;
      case 'openTaskCount':
        return Prisma.sql`"openTaskCount"`;
      case 'lastContactedAt':
        return Prisma.sql`"lastContactedAt"`;
      case 'trialStartDate':
        return Prisma.sql`"trialStartAt"`;
      case 'trialEndDate':
        return Prisma.sql`"trialEndAt"`;
      case 'value':
        return Prisma.sql`"dealValue"`;
    }
  }

  private getEmptySummary(): CrmPipelineTableSummary {
    return {
      progressingDeals: 0,
      stuckDeals: 0,
      closingDeals: 0,
      totalPipelineValue: 0,
      wonValue: 0,
      lostDeals: 0,
      trialsExpiringSoon: 0,
      totalCommission: 0,
    };
  }
}
