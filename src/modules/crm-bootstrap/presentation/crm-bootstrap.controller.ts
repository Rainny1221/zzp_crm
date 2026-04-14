import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { CrmBootstrapService } from '../application/crm-bootstrap.service';

@ApiTags('CRM Bootstrap')
@ApiBearerAuth('access-token')
@Controller('crm')
export class CrmBootstrapController {
  constructor(private readonly bootstrapService: CrmBootstrapService) {}

  @Get('bootstrap')
  @ApiOperation({ summary: 'Get CRM bootstrap data' })
  @RequirePermissions('CRM_BOOTSTRAP_VIEW')
  async getCrmBootstrap(@Req() req: AuthenticatedRequest) {
    return this.bootstrapService.getBootstrap(req.user);
  }
}
