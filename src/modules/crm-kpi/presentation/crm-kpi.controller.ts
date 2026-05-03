import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { UpsertCrmKpiSalesTargetCommand } from '../application/commands';
import {
  GetCrmKpiOverviewQuery,
  GetCrmKpiSalesQuery,
  GetCrmKpiSalesTargetQuery,
} from '../application/queries';
import { GetCrmKpiOverviewDto } from './dto/get-crm-kpi-overview.dto';
import { GetCrmKpiSalesDto } from './dto/get-crm-kpi-sales.dto';
import { GetCrmKpiSalesTargetDto } from './dto/get-crm-kpi-sales-target.dto';
import { UpsertCrmKpiSalesTargetDto } from './dto/upsert-crm-kpi-sales-target.dto';

@ApiTags('CRM KPI')
@ApiBearerAuth('access-token')
@Controller('crm/kpi')
export class CrmKpiController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get CRM KPI overview' })
  @RequirePermissions('CRM_REPORT_VIEW')
  async getOverview(
    @Query() query: GetCrmKpiOverviewDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.queryBus.execute(
      new GetCrmKpiOverviewQuery({
        from: query.from,
        to: query.to,
        source: query.source,
        assignee: query.assignee,
        stage: query.stage,
        productPackage: query.productPackage,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );

    return result;
  }

  @Get('sales/:salesRepId')
  @ApiOperation({ summary: 'Get CRM KPI for a sales rep' })
  @RequirePermissions('CRM_REPORT_VIEW')
  async getSalesKpi(
    @Param('salesRepId', ParseIntPipe) salesRepId: number,
    @Query() query: GetCrmKpiSalesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.queryBus.execute(
      new GetCrmKpiSalesQuery({
        salesRepId,
        from: query.from,
        to: query.to,
        source: query.source,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );

    return result;
  }

  @Get('targets/sales/:salesRepId')
  @ApiOperation({ summary: 'Get CRM KPI target for a sales rep' })
  @RequirePermissions('CRM_KPI_VIEW')
  async getSalesTarget(
    @Param('salesRepId', ParseIntPipe) salesRepId: number,
    @Query() query: GetCrmKpiSalesTargetDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.queryBus.execute(
      new GetCrmKpiSalesTargetQuery({
        salesRepId,
        periodType: query.periodType,
        periodStart: query.periodStart,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );

    return result;
  }

  @Put('targets/sales/:salesRepId')
  @ApiOperation({ summary: 'Set CRM KPI target for a sales rep' })
  @RequirePermissions('CRM_KPI_MANAGE')
  async upsertSalesTarget(
    @Param('salesRepId', ParseIntPipe) salesRepId: number,
    @Body() dto: UpsertCrmKpiSalesTargetDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<unknown> {
    const result: unknown = await this.commandBus.execute(
      new UpsertCrmKpiSalesTargetCommand({
        salesRepId,
        periodType: dto.periodType,
        periodStart: dto.periodStart,
        leadsTarget: dto.leadsTarget,
        qualifiedTarget: dto.qualifiedTarget,
        wonDealsTarget: dto.wonDealsTarget,
        pipelineValueTarget: dto.pipelineValueTarget,
        wonValueTarget: dto.wonValueTarget,
        actorUserId: req.user.id,
        actorRoleName: req.user.roleName ?? null,
      }),
    );

    return result;
  }
}
