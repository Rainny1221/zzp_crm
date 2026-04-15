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
  CrmDashboardTeamPerformanceResponse,
  GetCrmDashboardAdminQueryFilters,
  GetCrmDashboardAdminQueryResult,
} from '../../application/queries';
import { CRM_DASHBOARD_LOG } from '../../domain/crm-dashboard.constants';

type KpiRow = CrmDashboardKpiStripResponse;
type SalesPerformanceRow = CrmDashboardSalesPerformanceResponse;
type TeamPerformanceRow = CrmDashboardTeamPerformanceResponse;
type LeadDistributionRow = CrmDashboardLeadDistributionResponse;
type LeadSourceRow = CrmDashboardLeadSourceResponse;
type FailureAnalysisRow = CrmDashboardFailureAnalysisResponse;
type QuickActionsRow = CrmDashboardQuickActionsResponse;

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

  private buildWhereSql(params: GetCrmDashboardAdminQueryFilters): Prisma.Sql {
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

  private getEmptyQuickActions(): CrmDashboardQuickActionsResponse {
    return {
      unassignedLeads: 0,
      stuckDeals: 0,
      closingDeals: 0,
      trialsExpiringSoon: 0,
    };
  }
}
