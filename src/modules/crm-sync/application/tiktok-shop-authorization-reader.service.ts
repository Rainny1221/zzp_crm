import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/** Latest valid `tiktok_shop_authorizations` row for a user (created_by = user id). */
export type ValidTiktokShopAuthorization = {
  authorizationId: number;
  /** Same as DB `created_at` on the chosen row — business “authorized at”. */
  authorizedAt: Date;
};

/**
 * Reads `tiktok_shop_authorizations` (physical table; not in this Nest module’s domain otherwise).
 */
@Injectable()
export class TiktokShopAuthorizationReaderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valid row: not soft-deleted, and `is_authorized` is true or null (treat null as authorized per legacy default).
   * Returns null when there is no qualifying row — orchestration must not create CRM entities.
   */
  async getLatestValidAuthorization(
    userId: number,
  ): Promise<ValidTiktokShopAuthorization | null> {
    const row = await this.prisma.tiktok_shop_authorizations.findFirst({
      where: {
        created_by: userId,
        deleted_at: null,
        OR: [{ is_authorized: true }, { is_authorized: null }],
      },
      orderBy: { created_at: 'desc' },
      select: { id: true, created_at: true },
    });

    if (!row) {
      return null;
    }

    return {
      authorizationId: row.id,
      authorizedAt: row.created_at,
    };
  }
}
