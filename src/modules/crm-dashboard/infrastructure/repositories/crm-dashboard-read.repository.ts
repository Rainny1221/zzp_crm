import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { Prisma } from 'src/generated/prisma/client';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import type {
  CrmDashboardFailureAnalysisResponse,
  CrmDashboardKpiStripResponse,
  CrmDashboardLeadDistributionResponse,
  CrmDashboardLeadSourceResponse,
  CrmDashboardQuickActionsResponse,
  CrmDashboardSalesPerformanceResponse,
  CrmDashboardSalesKpiStripResponse,
  CrmDashboardSalesRepResponse,
  CrmDashboardTeamPerformanceResponse,
  GetCrmDashboardAdminQueryFilters,
  GetCrmDashboardAdminQueryResult,
  GetCrmDashboardSalesQueryFilters,
} from '../../application/queries';
import { CRM_DASHBOARD_LOG } from '../../domain/crm-dashboard.constants';
import type { CrmPipelineTableRow } from 'src/modules/crm-pipeline/infrastructure/repositories/crm-pipeline-read.repository';

type KpiRow = CrmDashboardKpiStripResponse;
type SalesKpiRow = CrmDashboardSalesKpiStripResponse;
type SalesPerformanceRow = CrmDashboardSalesPerformanceResponse;
type TeamPerformanceRow = CrmDashboardTeamPerformanceResponse;
type LeadDistributionRow = CrmDashboardLeadDistributionResponse;
type LeadSourceRow = CrmDashboardLeadSourceResponse;
type FailureAnalysisRow = CrmDashboardFailureAnalysisResponse;
type QuickActionsRow = CrmDashboardQuickActionsResponse;
type CountRow = {
  count: number;
};

type CrmDashboardBaseFilters = Pick<
  GetCrmDashboardAdminQueryFilters,
  'from' | 'to' | 'assignee' | 'source'
>;

export type GetCrmDashboardSalesReadResult = {
  salesRep: CrmDashboardSalesRepResponse;
  kpiStrip: CrmDashboardSalesKpiStripResponse;
  leadDistribution: CrmDashboardLeadDistributionResponse[];
  leadSources: CrmDashboardLeadSourceResponse[];
  failureAnalysis: CrmDashboardFailureAnalysisResponse[];
  quickActions: CrmDashboardQuickActionsResponse;
  personalPipelineRows: CrmPipelineTableRow[];
  personalPipelineTotal: number;
};

const PERSONAL_PIPELINE_LIMIT = 20;

@Injectable()
export class CrmDashboardReadRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getAdminDashboard(
    params: GetCrmDashboardAdminQueryFilters,
  ): Promise<GetCrmDashboardAdminQueryResult> {
    const whereSql = this.buildWhereSql(params);
    const baseSql = this.buildBaseSql(whereSql);

    try {
      const [
        kpiStrip,
        salesPerformance,
        teamPerformance,
        leadDistribution,
        leadSources,
        failureAnalysis,
        quickActions,
      ] = await Promise.all([
        this.getKpiStrip(baseSql),
        this.getSalesPerformance(baseSql),
        this.getTeamPerformance(baseSql),
        this.getLeadDistribution(baseSql),
        this.getLeadSources(baseSql),
        this.getFailureAnalysis(baseSql),
        this.getQuickActions(baseSql),
      ]);

      this.logger.debug({
        message: 'CRM admin dashboard loaded',
        context: CrmDashboardReadRepository.name,
        module: CRM_DASHBOARD_LOG.MODULE,
        action: CRM_DASHBOARD_LOG.ACTIONS.GET_ADMIN,
        entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
        meta: {
          filters: params,
          totalCustomers: kpiStrip.totalCustomers,
          activeDeals: kpiStrip.activeDeals,
        },
      });

      return {
        kpiStrip,
        salesPerformance,
        teamPerformance,
        leadDistribution,
        leadSources,
        failureAnalysis,
        quickActions,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to load CRM admin dashboard',
        context: CrmDashboardReadRepository.name,
        module: CRM_DASHBOARD_LOG.MODULE,
        action: CRM_DASHBOARD_LOG.ACTIONS.GET_ADMIN,
        entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
        meta: {
          filters: params,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.INTERNAL_ERROR,
        'Failed to load CRM admin dashboard',
        {
          filters: params,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async getSalesDashboard(
    params: GetCrmDashboardSalesQueryFilters,
  ): Promise<GetCrmDashboardSalesReadResult> {
    const baseFilters: CrmDashboardBaseFilters = {
      from: params.from,
      to: params.to,
      source: params.source,
      assignee: String(params.salesRepId),
    };
    const whereSql = this.buildWhereSql(baseFilters);
    const baseSql = this.buildBaseSql(whereSql);
    const personalPipelineBaseSql = this.buildPersonalPipelineBaseSql(whereSql);

    try {
      const [
        salesRep,
        kpiStrip,
        leadDistribution,
        leadSources,
        failureAnalysis,
        quickActions,
        personalPipelineRows,
        personalPipelineTotal,
      ] = await Promise.all([
        this.getSalesRep(params.salesRepId),
        this.getSalesKpiStrip(baseSql),
        this.getLeadDistribution(baseSql),
        this.getLeadSources(baseSql),
        this.getFailureAnalysis(baseSql),
        this.getQuickActions(baseSql),
        this.getPersonalPipelineRows(personalPipelineBaseSql),
        this.getPersonalPipelineTotal(personalPipelineBaseSql),
      ]);

      this.logger.debug({
        message: 'CRM sales dashboard loaded',
        context: CrmDashboardReadRepository.name,
        module: CRM_DASHBOARD_LOG.MODULE,
        action: CRM_DASHBOARD_LOG.ACTIONS.GET_SALES,
        entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
        entityId: params.salesRepId,
        meta: {
          filters: params,
          assignedCustomers: kpiStrip.assignedCustomers,
          activeDeals: kpiStrip.activeDeals,
          personalPipelineTotal,
        },
      });

      return {
        salesRep,
        kpiStrip,
        leadDistribution,
        leadSources,
        failureAnalysis,
        quickActions,
        personalPipelineRows,
        personalPipelineTotal,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to load CRM sales dashboard',
        context: CrmDashboardReadRepository.name,
        module: CRM_DASHBOARD_LOG.MODULE,
        action: CRM_DASHBOARD_LOG.ACTIONS.GET_SALES,
        entityType: CRM_DASHBOARD_LOG.ENTITIES.DASHBOARD,
        entityId: params.salesRepId,
        meta: {
          filters: params,
          error: toErrorMeta(error),
        },
      });

      throw error;
    }
  }

  private async getSalesRep(
    salesRepId: number,
  ): Promise<CrmDashboardSalesRepResponse> {
    const salesRep = await this.prisma.user.findFirst({
      where: {
        id: salesRepId,
        deleted_at: null,
        is_active: true,
        is_block: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar_name: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!salesRep) {
      throw ErrorFactory.create(
        ErrorCode.ITEM_NOT_FOUND,
        'CRM sales rep not found or inactive',
        { salesRepId },
      );
    }

    return {
      id: String(salesRep.id),
      name:
        [salesRep.first_name, salesRep.last_name].filter(Boolean).join(' ') ||
        salesRep.username ||
        salesRep.email ||
        `User ${salesRep.id}`,
      email: salesRep.email,
      avatar: salesRep.avatar_name,
      role: salesRep.role?.name ?? null,
    };
  }

  private async getKpiStrip(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardKpiStripResponse> {
    const rows = await this.prisma.$queryRaw<KpiRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        COUNT(DISTINCT "customerId")::int AS "totalCustomers",
        COUNT(*) FILTER (
          WHERE COALESCE("statusCode", 'new') NOT IN ('success', 'failed')
        )::int AS "activeDeals",
        COALESCE(SUM(COALESCE("dealValue", 0)), 0)::double precision
          AS "pipelineValue",
        COALESCE(SUM(COALESCE("dealValue", 0)) FILTER (
          WHERE "statusCode" = 'success'
        ), 0)::double precision AS "wonValue",
        COUNT(*) FILTER (
          WHERE "statusCode" = 'failed'
        )::int AS "lostDeals",
        COALESCE(
          ROUND(
            (
              COUNT(*) FILTER (WHERE "statusCode" = 'success')::numeric
              / NULLIF(COUNT(*), 0)
            ) * 100,
            2
          ),
          0
        )::double precision AS "conversionRate"
      FROM base
    `);

    return rows[0] ?? this.getEmptyKpiStrip();
  }

  private async getSalesKpiStrip(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardSalesKpiStripResponse> {
    const rows = await this.prisma.$queryRaw<SalesKpiRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        COUNT(DISTINCT "customerId")::int AS "assignedCustomers",
        COUNT(*) FILTER (
          WHERE COALESCE("statusCode", 'new') NOT IN ('success', 'failed')
        )::int AS "activeDeals",
        COALESCE(SUM(COALESCE("dealValue", 0)), 0)::double precision
          AS "pipelineValue",
        COALESCE(SUM(COALESCE("dealValue", 0)) FILTER (
          WHERE "statusCode" = 'success'
        ), 0)::double precision AS "wonValue",
        COUNT(*) FILTER (
          WHERE "statusCode" = 'failed'
        )::int AS "lostDeals",
        COALESCE(
          ROUND(
            (
              COUNT(*) FILTER (WHERE "statusCode" = 'success')::numeric
              / NULLIF(COUNT(*), 0)
            ) * 100,
            2
          ),
          0
        )::double precision AS "conversionRate"
      FROM base
    `);

    return rows[0] ?? this.getEmptySalesKpiStrip();
  }

  private async getSalesPerformance(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardSalesPerformanceResponse[]> {
    return this.prisma.$queryRaw<SalesPerformanceRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        "ownerId"::text AS "salesRepId",
        COALESCE("ownerName", "ownerEmail", CONCAT('User ', "ownerId")) AS "name",
        "ownerEmail" AS "email",
        "ownerAvatar" AS "avatar",
        "ownerRole" AS "role",
        COUNT(*) FILTER (
          WHERE COALESCE("statusCode", 'new') NOT IN ('success', 'failed')
        )::int AS "openDeals",
        COALESCE(SUM(COALESCE("dealValue", 0)), 0)::double precision
          AS "pipelineValue",
        COALESCE(SUM(COALESCE("dealValue", 0)) FILTER (
          WHERE "statusCode" = 'success'
        ), 0)::double precision AS "wonValue",
        COUNT(*) FILTER (
          WHERE "statusCode" = 'failed'
        )::int AS "lostDeals",
        COALESCE(
          ROUND(
            (
              COUNT(*) FILTER (WHERE "statusCode" = 'success')::numeric
              / NULLIF(COUNT(*), 0)
            ) * 100,
            2
          ),
          0
        )::double precision AS "conversionRate"
      FROM base
      WHERE "ownerId" IS NOT NULL
      GROUP BY "ownerId", "ownerName", "ownerEmail", "ownerAvatar", "ownerRole"
      ORDER BY "pipelineValue" DESC, "openDeals" DESC, "name" ASC
    `);
  }

  private async getTeamPerformance(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardTeamPerformanceResponse[]> {
    return this.prisma.$queryRaw<TeamPerformanceRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        NULL::text AS "teamId",
        'Unassigned team' AS "teamName",
        COUNT(*) FILTER (
          WHERE COALESCE("statusCode", 'new') NOT IN ('success', 'failed')
        )::int AS "openDeals",
        COALESCE(SUM(COALESCE("dealValue", 0)), 0)::double precision
          AS "pipelineValue",
        COALESCE(SUM(COALESCE("dealValue", 0)) FILTER (
          WHERE "statusCode" = 'success'
        ), 0)::double precision AS "wonValue"
      FROM base
      HAVING COUNT(*) > 0
    `);
  }

  private async getLeadDistribution(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardLeadDistributionResponse[]> {
    return this.prisma.$queryRaw<LeadDistributionRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        stage.code AS "stage",
        COUNT(base."dealId")::int AS "count",
        COALESCE(SUM(COALESCE(base."dealValue", 0)), 0)::double precision
          AS "value"
      FROM crm_pipeline_stages stage
      LEFT JOIN base ON base."stage" = stage.code
      WHERE stage.is_active = true
      GROUP BY stage.code, stage.stage_order
      HAVING COUNT(base."dealId") > 0
      ORDER BY stage.stage_order ASC, stage.code ASC
    `);
  }

  private async getLeadSources(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardLeadSourceResponse[]> {
    return this.prisma.$queryRaw<LeadSourceRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        COALESCE("source", 'unknown') AS "source",
        COUNT(*)::int AS "count",
        COALESCE(SUM(COALESCE("dealValue", 0)), 0)::double precision
          AS "value"
      FROM base
      GROUP BY COALESCE("source", 'unknown')
      ORDER BY "count" DESC, "value" DESC, "source" ASC
    `);
  }

  private async getFailureAnalysis(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardFailureAnalysisResponse[]> {
    return this.prisma.$queryRaw<FailureAnalysisRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        reason.code AS "failureReason",
        reason.label AS "label",
        COUNT(base."dealId")::int AS "count"
      FROM crm_failure_reasons reason
      LEFT JOIN base ON base."failureReason" = reason.code
      WHERE reason.is_active = true
      GROUP BY reason.code, reason.label, reason.sort_order
      ORDER BY "count" DESC, reason.sort_order ASC, reason.code ASC
    `);
  }

  private async getQuickActions(
    baseSql: Prisma.Sql,
  ): Promise<CrmDashboardQuickActionsResponse> {
    const rows = await this.prisma.$queryRaw<QuickActionsRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT
        COUNT(*) FILTER (
          WHERE "statusCode" = 'new'
            AND "ownerId" IS NULL
        )::int AS "unassignedLeads",
        COUNT(*) FILTER (
          WHERE COALESCE("statusCode", 'new') NOT IN ('success', 'failed')
            AND COALESCE(
              "lastActivityAt",
              "lastContactedAt",
              "customerCreatedAt"
            ) < now() - interval '7 days'
        )::int AS "stuckDeals",
        COUNT(*) FILTER (
          WHERE "stage" IN ('negotiation', 'close_deal')
        )::int AS "closingDeals",
        COUNT(*) FILTER (
          WHERE "trialEndAt" >= now()
            AND "trialEndAt" <= now() + interval '7 days'
        )::int AS "trialsExpiringSoon"
      FROM base
    `);

    return rows[0] ?? this.getEmptyQuickActions();
  }

  private async getPersonalPipelineRows(
    baseSql: Prisma.Sql,
  ): Promise<CrmPipelineTableRow[]> {
    return this.prisma.$queryRaw<CrmPipelineTableRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT *
      FROM base
      ORDER BY
        "lastActivityAt" DESC NULLS LAST,
        "lastContactedAt" DESC NULLS LAST,
        "stageTransitionAt" DESC NULLS LAST,
        "dealValue" DESC NULLS LAST,
        "dealId" ASC
      LIMIT ${PERSONAL_PIPELINE_LIMIT}
    `);
  }

  private async getPersonalPipelineTotal(baseSql: Prisma.Sql): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
      WITH base AS (
        ${baseSql}
      )
      SELECT COUNT(*)::int AS "count"
      FROM base
    `);

    return rows[0]?.count ?? 0;
  }

  private buildBaseSql(whereSql: Prisma.Sql): Prisma.Sql {
    return Prisma.sql`
      SELECT
        c.id::text AS "customerId",
        d.id::text AS "dealId",
        c.source_code AS "source",
        d.pipeline_stage_code AS "stage",
        d.status AS "statusCode",
        d.deal_value::double precision AS "dealValue",
        dd.closed_revenue::double precision AS "revenue",
        dd.failure_reason_code AS "failureReason",
        dd.trial_end_date AS "trialEndAt",
        dd.last_contacted_at AS "lastContactedAt",
        d.owner_id AS "ownerId",
        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', owner.first_name, owner.last_name)), ''),
          owner.username,
          owner.email
        ) AS "ownerName",
        owner.email AS "ownerEmail",
        owner.avatar_name AS "ownerAvatar",
        owner_role.name AS "ownerRole",
        last_activity.last_activity_at AS "lastActivityAt",
        c.created_at AS "customerCreatedAt"
      ${this.buildFromSql()}
      ${whereSql}
    `;
  }

  private buildPersonalPipelineBaseSql(whereSql: Prisma.Sql): Prisma.Sql {
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
      ${this.buildPersonalPipelineFromSql()}
      ${whereSql}
    `;
  }

  private buildPersonalPipelineFromSql(): Prisma.Sql {
    return Prisma.sql`
      FROM crm_customer_profiles c
      JOIN crm_deals d ON d.customer_id = c.id
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

  private buildFromSql(): Prisma.Sql {
    return Prisma.sql`
      FROM crm_customer_profiles c
      JOIN crm_deals d ON d.customer_id = c.id
      LEFT JOIN crm_deal_details dd ON dd.deal_id = d.id
      LEFT JOIN users owner ON owner.id = d.owner_id
      LEFT JOIN roles owner_role ON owner_role.id = owner.role_id
      LEFT JOIN LATERAL (
        SELECT MAX(activity.occurred_at) AS last_activity_at
        FROM crm_activities activity
        WHERE activity.customer_id = c.id
      ) last_activity ON true
    `;
  }

  private buildWhereSql(params: CrmDashboardBaseFilters): Prisma.Sql {
    const where: Prisma.Sql[] = [];

    if (params.from) {
      where.push(
        Prisma.sql`c.created_at >= ${this.toDateBoundary(params.from, false)}`,
      );
    }

    if (params.to) {
      where.push(
        Prisma.sql`c.created_at <= ${this.toDateBoundary(params.to, true)}`,
      );
    }

    if (params.source !== 'all') {
      where.push(Prisma.sql`c.source_code = ${params.source}`);
    }

    if (params.assignee === 'unassigned') {
      where.push(Prisma.sql`d.owner_id IS NULL`);
    } else if (params.assignee !== 'all') {
      where.push(Prisma.sql`d.owner_id = ${Number(params.assignee)}`);
    }

    if (!where.length) {
      return Prisma.empty;
    }

    return Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`;
  }

  private toDateBoundary(value: string, endOfDay: boolean): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value);
    }

    const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    return new Date(`${value}${suffix}`);
  }

  private getEmptyKpiStrip(): CrmDashboardKpiStripResponse {
    return {
      totalCustomers: 0,
      activeDeals: 0,
      pipelineValue: 0,
      wonValue: 0,
      lostDeals: 0,
      conversionRate: 0,
    };
  }

  private getEmptySalesKpiStrip(): CrmDashboardSalesKpiStripResponse {
    return {
      assignedCustomers: 0,
      activeDeals: 0,
      pipelineValue: 0,
      wonValue: 0,
      lostDeals: 0,
      conversionRate: 0,
    };
  }

  private getEmptyQuickActions(): CrmDashboardQuickActionsResponse {
    return {
      unassignedLeads: 0,
      stuckDeals: 0,
      closingDeals: 0,
      trialsExpiringSoon: 0,
    };
  }
}
