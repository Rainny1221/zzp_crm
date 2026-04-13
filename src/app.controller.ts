import { Controller, Get, Req } from '@nestjs/common';
import { RequirePermissions } from './common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from './common/interfaces/authenticated-request.interface';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('crm/bootstrap')
  @RequirePermissions('CRM_BOOTSTRAP_VIEW')
  getCrmBootstrap(@Req() req: AuthenticatedRequest) {
    return {
      permission: 'CRM_BOOTSTRAP_VIEW',
      allowed: true,
      user: req.user,
    };
  }
}
