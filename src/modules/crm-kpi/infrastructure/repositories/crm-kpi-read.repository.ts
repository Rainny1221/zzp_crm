import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type {
  GetCrmKpiOverviewFilters,
  GetCrmKpiSalesFilters,
} from '../../application/queries';

type KpiWhereParams = {
  from?: string;
  to?: string;
  source: string;
  assignee: string;
  stage: string;
  productPackage: string;
  salesRepId: number | null;
};

@Injectable()
export class CrmKpiReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(filters: GetCrmKpiOverviewFilters) {
    const where = this.buildBaseWhere({
      from: filters.from,
      to: filters.to,
      source: filters.source,
      assignee: filters.assignee,
      stage: filters.stage,
      productPackage: filters.productPackage,
      salesRepId: null,
    });

    const [summary, funnel, leaderboard, sources, packages, failureReasons] =
      await Promise.all([
        this.getOverviewSummary(where),
        this.getFunnel(where),
        this.getLeaderboard(where),
        this.getSourceBreakdown(where),
        this.getPackageBreakdown(where),
        this.getFailureBreakdown(where),
      ]);

    return {
      period: {
        from: filters.from ?? null,
        to: filters.to ?? null,
      },
      summary,
      funnel,
      leaderboard,
      breakdowns: {
        sources,
        packages,
        failureReasons,
      },
    };
  }

  async getSalesKpi(filters: GetCrmKpiSalesFilters) {
    const where = this.buildBaseWhere({
      from: filters.from,
      to: filters.to,
      source: filters.source,
      assignee: 'all',
      stage: 'all',
      productPackage: 'all',
      salesRepId: filters.salesRepId,
    });

    const [salesRep, summary, funnel, packages, recentDeals] =
      await Promise.all([
        this.getSalesRepInfo(filters.salesRepId),
        this.getSalesSummary(where),
        this.getFunnel(where),
        this.getPackageBreakdown(where),
        this.getRecentDeals(where),
      ]);

    return {
      salesRep,
      period: {
        from: filters.from ?? null,
        to: filters.to ?? null,
      },
      summary,
      funnel,
      packages,
      recentDeals,
    };
  }

  private buildBaseWhere(params: KpiWhereParams): Prisma.Sql {
    const where: Prisma.Sql[] = [Prisma.sql`1 = 1`];

    if (params.from) {
      where.push(Prisma.sql`d.created_at >= ${new Date(params.from)}`);
    }

    if (params.to) {
      where.push(Prisma.sql`d.created_at <= ${new Date(params.to)}`);
    }

    if (params.source !== 'all') {
      where.push(Prisma.sql`c.source_code = ${params.source}`);
    }

    if (params.assignee === 'unassigned') {
      where.push(Prisma.sql`d.owner_id IS NULL`);
    } else if (params.assignee !== 'all') {
      const assigneeId = Number(params.assignee);
      where.push(
        Number.isInteger(assigneeId) && assigneeId > 0
          ? Prisma.sql`d.owner_id = ${assigneeId}`
          : Prisma.sql`1 = 0`,
      );
    }

    if (params.stage !== 'all') {
      where.push(Prisma.sql`d.pipeline_stage_code = ${params.stage}`);
    }

    if (params.productPackage !== 'all') {
      where.push(Prisma.sql`d.product_package_code = ${params.productPackage}`);
    }

    if (params.salesRepId != null) {
      where.push(Prisma.sql`d.owner_id = ${params.salesRepId}`);
    }

    return Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`;
  }

  private async getOverviewSummary(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        totalLeads: bigint;
        assignedLeads: bigint;
        qualifiedLeads: bigint;
        wonDeals: bigint;
        lostDeals: bigint;
        pipelineValue: number | null;
        wonValue: number | null;
      }>
    >(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS "totalLeads",
        COUNT(*) FILTER (WHERE d.owner_id IS NOT NULL)::bigint AS "assignedLeads",
        COUNT(*) FILTER (
          WHERE d.pipeline_stage_code IN ('qualified', 'booking_demo', 'demo', 'proposal', 'negotiation', 'close_deal')
        )::bigint AS "qualifiedLeads",
        COUNT(*) FILTER (WHERE d.status = 'success')::bigint AS "wonDeals",
        COUNT(*) FILTER (WHERE d.status = 'failed')::bigint AS "lostDeals",
        COALESCE(SUM(d.deal_value), 0)::double precision AS "pipelineValue",
        COALESCE(SUM(d.deal_value) FILTER (WHERE d.status = 'success'), 0)::double precision AS "wonValue"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      ${where}
    `);

    const row = rows[0];
    const totalLeads = Number(row?.totalLeads ?? 0);
    const wonDeals = Number(row?.wonDeals ?? 0);

    return {
      totalLeads,
      assignedLeads: Number(row?.assignedLeads ?? 0),
      qualifiedLeads: Number(row?.qualifiedLeads ?? 0),
      wonDeals,
      lostDeals: Number(row?.lostDeals ?? 0),
      pipelineValue: Number(row?.pipelineValue ?? 0),
      wonValue: Number(row?.wonValue ?? 0),
      conversionRate: totalLeads > 0 ? wonDeals / totalLeads : 0,
    };
  }

  private async getSalesSummary(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        assignedLeads: bigint;
        qualifiedLeads: bigint;
        wonDeals: bigint;
        lostDeals: bigint;
        pipelineValue: number | null;
        wonValue: number | null;
      }>
    >(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS "assignedLeads",
        COUNT(*) FILTER (
          WHERE d.pipeline_stage_code IN ('qualified', 'booking_demo', 'demo', 'proposal', 'negotiation', 'close_deal')
        )::bigint AS "qualifiedLeads",
        COUNT(*) FILTER (WHERE d.status = 'success')::bigint AS "wonDeals",
        COUNT(*) FILTER (WHERE d.status = 'failed')::bigint AS "lostDeals",
        COALESCE(SUM(d.deal_value), 0)::double precision AS "pipelineValue",
        COALESCE(SUM(d.deal_value) FILTER (WHERE d.status = 'success'), 0)::double precision AS "wonValue"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      ${where}
    `);

    const row = rows[0];
    const assignedLeads = Number(row?.assignedLeads ?? 0);
    const wonDeals = Number(row?.wonDeals ?? 0);

    return {
      assignedLeads,
      qualifiedLeads: Number(row?.qualifiedLeads ?? 0),
      wonDeals,
      lostDeals: Number(row?.lostDeals ?? 0),
      pipelineValue: Number(row?.pipelineValue ?? 0),
      wonValue: Number(row?.wonValue ?? 0),
      conversionRate: assignedLeads > 0 ? wonDeals / assignedLeads : 0,
    };
  }

  private async getFunnel(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{ stage: string; count: bigint; value: number | null }>
    >(Prisma.sql`
      SELECT
        d.pipeline_stage_code AS "stage",
        COUNT(*)::bigint AS "count",
        COALESCE(SUM(d.deal_value), 0)::double precision AS "value"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      ${where}
      GROUP BY d.pipeline_stage_code
      ORDER BY d.pipeline_stage_code ASC
    `);

    return rows.map((row) => ({
      stage: row.stage,
      count: Number(row.count),
      value: Number(row.value ?? 0),
    }));
  }

  private async getLeaderboard(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        salesRepId: string | null;
        name: string | null;
        email: string | null;
        avatar: string | null;
        role: string | null;
        assignedLeads: bigint;
        pipelineValue: number | null;
        wonValue: number | null;
        wonDeals: bigint;
      }>
    >(Prisma.sql`
      SELECT
        d.owner_id::text AS "salesRepId",
        COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''),
          u.username,
          u.email
        ) AS "name",
        u.email AS "email",
        u.avatar_name AS "avatar",
        r.name AS "role",
        COUNT(*)::bigint AS "assignedLeads",
        COALESCE(SUM(d.deal_value), 0)::double precision AS "pipelineValue",
        COALESCE(SUM(d.deal_value) FILTER (WHERE d.status = 'success'), 0)::double precision AS "wonValue",
        COUNT(*) FILTER (WHERE d.status = 'success')::bigint AS "wonDeals"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      LEFT JOIN users u ON u.id = d.owner_id
      LEFT JOIN roles r ON r.id = u.role_id
      ${where}
        AND d.owner_id IS NOT NULL
      GROUP BY d.owner_id, u.id, r.id
      ORDER BY "pipelineValue" DESC, "assignedLeads" DESC
    `);

    return rows.map((row) => {
      const assignedLeads = Number(row.assignedLeads);
      const wonDeals = Number(row.wonDeals);

      return {
        salesRepId: row.salesRepId,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        role: row.role,
        assignedLeads,
        pipelineValue: Number(row.pipelineValue ?? 0),
        wonValue: Number(row.wonValue ?? 0),
        conversionRate: assignedLeads > 0 ? wonDeals / assignedLeads : 0,
      };
    });
  }

  private async getSourceBreakdown(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{ source: string; count: bigint; value: number | null }>
    >(Prisma.sql`
      SELECT
        c.source_code AS "source",
        COUNT(*)::bigint AS "count",
        COALESCE(SUM(d.deal_value), 0)::double precision AS "value"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      ${where}
      GROUP BY c.source_code
      ORDER BY c.source_code ASC
    `);

    return rows.map((row) => ({
      source: row.source,
      count: Number(row.count),
      value: Number(row.value ?? 0),
    }));
  }

  private async getPackageBreakdown(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        productPackage: string | null;
        count: bigint;
        value: number | null;
      }>
    >(Prisma.sql`
      SELECT
        d.product_package_code AS "productPackage",
        COUNT(*)::bigint AS "count",
        COALESCE(SUM(d.deal_value), 0)::double precision AS "value"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      ${where}
      GROUP BY d.product_package_code
      ORDER BY d.product_package_code ASC
    `);

    return rows.map((row) => ({
      productPackage: row.productPackage,
      count: Number(row.count),
      value: Number(row.value ?? 0),
    }));
  }

  private async getFailureBreakdown(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{ failureReason: string | null; count: bigint }>
    >(Prisma.sql`
      SELECT
        dd.failure_reason_code AS "failureReason",
        COUNT(*)::bigint AS "count"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      LEFT JOIN crm_deal_details dd ON dd.deal_id = d.id
      ${where}
        AND dd.failure_reason_code IS NOT NULL
      GROUP BY dd.failure_reason_code
      ORDER BY dd.failure_reason_code ASC
    `);

    return rows.map((row) => ({
      failureReason: row.failureReason,
      count: Number(row.count),
    }));
  }

  private async getSalesRepInfo(salesRepId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: salesRepId },
      include: { role: true },
    });

    if (!user) {
      return null;
    }

    return {
      id: String(user.id),
      name:
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        user.username ||
        user.email,
      email: user.email,
      avatar: user.avatar_name,
      role: user.role?.name ?? null,
    };
  }

  private async getRecentDeals(where: Prisma.Sql) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        customerId: string;
        email: string | null;
        pipelineStage: string;
        status: string | null;
        productPackage: string | null;
        dealValue: number | null;
        lastActivityAt: Date | null;
      }>
    >(Prisma.sql`
      SELECT
        d.id::text AS "id",
        c.id::text AS "customerId",
        bp.email AS "email",
        d.pipeline_stage_code AS "pipelineStage",
        d.status AS "status",
        d.product_package_code AS "productPackage",
        COALESCE(d.deal_value, 0)::double precision AS "dealValue",
        d.updated_at AS "lastActivityAt"
      FROM crm_deals d
      INNER JOIN crm_customer_profiles c ON c.id = d.customer_id
      LEFT JOIN crm_customer_business_profiles bp ON bp.customer_id = c.id
      ${where}
      ORDER BY d.updated_at DESC, d.id DESC
      LIMIT 10
    `);

    return {
      rows: rows.map((row) => ({
        id: row.id,
        customerId: row.customerId,
        email: row.email,
        pipelineStage: row.pipelineStage,
        status: row.status,
        productPackage: row.productPackage,
        dealValue: Number(row.dealValue ?? 0),
        lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
      })),
      total: rows.length,
    };
  }
}
