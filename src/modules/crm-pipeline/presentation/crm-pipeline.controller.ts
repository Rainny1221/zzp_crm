import { Controller, Get, Query, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { GetCrmPipelineTableQuery } from '../application/queries';
import { GetCrmPipelineTableDto } from './dto/get-crm-pipeline-table.dto';

@ApiTags('CRM Pipeline')
@ApiBearerAuth('access-token')
@Controller('crm/pipeline')
export class CrmPipelineController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('table')
  @ApiOperation({ summary: 'Get CRM pipeline table' })
  @RequirePermissions('CRM_PIPELINE_VIEW')
  async getTable(
    @Query() query: GetCrmPipelineTableDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.queryBus.execute(
      new GetCrmPipelineTableQuery({
        ...query,
        currentUserId: req.user.id,
        currentUserRoleName: req.user.roleName ?? null,
      }),
    );
  }
}
