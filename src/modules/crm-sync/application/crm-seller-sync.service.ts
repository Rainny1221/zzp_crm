import { Inject, Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CRM_SYNC_LOG } from '../domain/crm-sync.constants';
import type { CrmSellerSyncOutcome } from '../domain/crm-seller-sync.types';
import type { ICrmSyncWriterRepository } from '../domain/repositories/i-crm-sync-writer.repository';
import { I_CRM_SYNC_WRITER_REPOSITORY } from '../domain/repositories/i-crm-sync-writer.repository';
import { CrmSyncEligibilityService } from './crm-sync-eligibility.service';
import { TiktokShopAuthorizationReaderService } from './tiktok-shop-authorization-reader.service';

@Injectable()
export class CrmSellerSyncService {
  constructor(
    private readonly eligibility: CrmSyncEligibilityService,
    private readonly tiktokAuthReader: TiktokShopAuthorizationReaderService,
    @Inject(I_CRM_SYNC_WRITER_REPOSITORY)
    private readonly writer: ICrmSyncWriterRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async syncUser(userId: number): Promise<CrmSellerSyncOutcome> {
    const user = await this.eligibility.getEligibleSellerUser(userId);

    if (!user) {
      this.logger.debug({
        message: 'CRM seller sync skipped — user not eligible for seller CRM',
        context: CrmSellerSyncService.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.SYNC_SELLER_SNAPSHOT,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        entityId: userId,
        meta: { userId },
      });

      return { skipped: true };
    }

    const auth = await this.tiktokAuthReader.getLatestValidAuthorization(user.id);

    if (!auth) {
      this.logger.debug({
        message: 'CRM seller sync skipped — no valid TikTok shop authorization',
        context: CrmSellerSyncService.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.SYNC_SELLER_SNAPSHOT,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        entityId: userId,
        meta: { userId },
      });

      return { skipped: true };
    }

    const result = await this.writer.syncSellerSnapshot({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAuthorized: true,
      authorizedAt: auth.authorizedAt,
    });

    return { skipped: false, result };
  }
}
