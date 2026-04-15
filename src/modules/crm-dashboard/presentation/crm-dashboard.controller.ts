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
  GetCrmDashboardAdminQuery,
  GetCrmDashboardSalesQuery,
} from '../application/queries';
import { GetCrmDashboardAdminDto } from './dto/get-crm-dashboard-admin.dto';
import { GetCrmDashboardSalesDto } from './dto/get-crm-dashboard-sales.dto';

@ApiTags('CRM Dashboard')
@ApiBearerAuth('access-token')
@Controller('crm/dashboard')
export class CrmDashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('admin')
  @ApiOperation({ summary: 'Get CRM admin dashboard' })
  @RequirePermissions('CRM_REPORT_VIEW')
  async getAdminDashboard(
    @Query() query: GetCrmDashboardAdminDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queryBus.execute(
      new GetCrmDashboardAdminQuery({
        from: query.from,
        to: query.to,
        assignee: query.assignee,
        source: query.source,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );
  }

  @Get('sales/:salesRepId')
  @ApiOperation({ summary: 'Get CRM sales dashboard' })
  @RequirePermissions('CRM_REPORT_VIEW')
  async getSalesDashboard(
    @Param('salesRepId', ParseIntPipe) salesRepId: number,
    @Query() query: GetCrmDashboardSalesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queryBus.execute(
      new GetCrmDashboardSalesQuery({
        salesRepId,
        from: query.from,
        to: query.to,
        source: query.source,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );
  }
}
