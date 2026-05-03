import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import {
  GetCrmKpiOverviewQuery,
  GetCrmKpiSalesQuery,
} from '../application/queries';
import { GetCrmKpiOverviewDto } from './dto/get-crm-kpi-overview.dto';
import { GetCrmKpiSalesDto } from './dto/get-crm-kpi-sales.dto';

@ApiTags('CRM KPI')
@ApiBearerAuth('access-token')
@Controller('crm/kpi')
export class CrmKpiController {
  constructor(private readonly queryBus: QueryBus) {}

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
}
