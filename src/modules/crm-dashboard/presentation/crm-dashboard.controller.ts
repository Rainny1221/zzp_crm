import { Controller, Get, Query, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { GetCrmDashboardAdminQuery } from '../application/queries';
import { GetCrmDashboardAdminDto } from './dto/get-crm-dashboard-admin.dto';

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
}
