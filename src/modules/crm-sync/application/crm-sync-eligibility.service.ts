import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CRM_SYNC_ELIGIBLE_ROLE_ID } from '../domain/crm-sync.constants';
import type { CrmSellerSyncUserRow } from '../domain/crm-seller-sync.types';

@Injectable()
export class CrmSyncEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Eligible seller user for CRM (TikTok-driven sync still requires a valid auth row in orchestration).
   */
  async getEligibleSellerUser(
    userId: number,
  ): Promise<CrmSellerSyncUserRow | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role_id: true,
        deleted_at: true,
        is_active: true,
        is_block: true,
      },
    });

    if (!user) {
      return null;
    }

    if (user.deleted_at !== null) {
      return null;
    }

    if (user.role_id !== CRM_SYNC_ELIGIBLE_ROLE_ID) {
      return null;
    }

    if (user.is_active === false) {
      return null;
    }

    if (user.is_block === true) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }
}
