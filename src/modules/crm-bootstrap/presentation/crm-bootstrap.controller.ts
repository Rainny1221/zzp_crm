import { Controller, Get, Req } from '@nestjs/common';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CRM_CUSTOMER_TIER_OPTIONS,
  CRM_SYNC_DEFAULTS,
} from '../../crm-sync/domain/crm-sync.constants';

@Controller('crm')
export class CrmBootstrapController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('bootstrap')
  @RequirePermissions('CRM_BOOTSTRAP_VIEW')
  async getCrmBootstrap(@Req() req: AuthenticatedRequest) {
    const productPackages = await this.prisma.crmProductPackages.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { code: 'asc' }],
      select: {
        code: true,
        label: true,
        is_active: true,
      },
    });

    return {
      permission: 'CRM_BOOTSTRAP_VIEW',
      allowed: true,
      user: req.user,
      lookups: {
        productPackages: productPackages.map((item) => ({
          code: item.code,
          label: item.label,
          isActive: item.is_active,
        })),
        tiers: CRM_CUSTOMER_TIER_OPTIONS,
      },
      defaults: {
        productPackageCode: CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE,
        tierCode: CRM_SYNC_DEFAULTS.CUSTOMER_TIER_CODE,
      },
    };
  }
}
