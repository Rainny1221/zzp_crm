import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import {
  buildCrmSyncTiktokAuthCreatedEventKey,
  CRM_SYNC_ELIGIBLE_ROLE_ID,
  CRM_SYNC_EVENT_TYPE,
  CRM_SYNC_JOB_STATUS,
  CRM_SYNC_LOG,
} from '../../domain/crm-sync.constants';
import type {
  EnqueueCrmSyncJobResult,
  ICrmSyncEnqueueRepository,
  SellerMissingCrmSyncRow,
} from '../../domain/repositories/i-crm-sync-enqueue.repository';

type RawSellerRow = {
  user_id: number;
  authorization_id: number;
};

@Injectable()
export class CrmSyncEnqueuePrismaRepository implements ICrmSyncEnqueueRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findSellersMissingCrmFromAuth(
    limit: number,
  ): Promise<SellerMissingCrmSyncRow[]> {
    try {
      const rows = await this.prisma.$queryRaw<RawSellerRow[]>(Prisma.sql`
        SELECT u.id AS user_id, t.id AS authorization_id
        FROM users u
                 INNER JOIN LATERAL (
            SELECT tsa.id
            FROM tiktok_shop_authorizations tsa
            WHERE tsa.created_by = u.id
              AND tsa.deleted_at IS NULL
              AND (tsa.is_authorized IS NULL OR tsa.is_authorized = TRUE)
            ORDER BY tsa.created_at DESC
            LIMIT 1
            ) t ON TRUE
        WHERE u.deleted_at IS NULL
          AND u.role_id = ${CRM_SYNC_ELIGIBLE_ROLE_ID}
          AND (u.is_active IS NULL OR u.is_active = TRUE)
          AND (u.is_block IS NULL OR u.is_block = FALSE)
          AND NOT EXISTS (SELECT 1
                            FROM crm_customer_profiles p
                            WHERE p.user_id = u.id)
        ORDER BY u.id ASC
            LIMIT ${limit}
      `);

      const mapped: SellerMissingCrmSyncRow[] = rows.map((r) => ({
        userId: r.user_id,
        authorizationId: r.authorization_id,
      }));

      this.logger.debug({
        message: 'CRM sync backfill: sellers with auth but no CRM profile listed',
        context: CrmSyncEnqueuePrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.BACKFILL,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        meta: {
          limit,
          count: mapped.length,
        },
      });

      return mapped;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to list CRM sync backfill sellers',
        context: CrmSyncEnqueuePrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.BACKFILL,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        meta: {
          limit,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to list CRM sync backfill sellers',
        {
          limit,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async enqueueTiktokAuthCreatedSyncJob(
    userId: number,
    authorizationId: number,
  ): Promise<EnqueueCrmSyncJobResult> {
    const now = new Date();
    const eventType = CRM_SYNC_EVENT_TYPE.TIKTOK_AUTH_CREATED;
    const eventKey = buildCrmSyncTiktokAuthCreatedEventKey(
      userId,
      authorizationId,
    );

    try {
      const jobs = await this.prisma.crmSyncJobs.createManyAndReturn({
        select: { id: true },
        data: {
          event_key: eventKey,
          event_type: eventType,
          user_id: userId,
          payload: {
            user_id: userId,
            authorization_id: authorizationId,
            backfilled: true,
          },
          status: CRM_SYNC_JOB_STATUS.PENDING,
          retry_count: 0,
          created_at: now,
          updated_at: now,
        },
        skipDuplicates: true,
      });

      const createdJob = jobs[0] ?? null;
      const existingJob =
        createdJob ??
        (await this.prisma.crmSyncJobs.findUnique({
          where: { event_key: eventKey },
          select: { id: true },
        }));

      if (!existingJob) {
        throw ErrorFactory.create(
          ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
          'Failed to resolve CRM sync job after enqueue',
          {
            userId,
            authorizationId,
            eventKey,
            eventType,
          },
        );
      }

      const enqueued = Boolean(createdJob);

      this.logger.debug({
        message: enqueued
          ? 'CRM sync job enqueued from backfill (TikTok auth)'
          : 'CRM sync job already exists during backfill',
        context: CrmSyncEnqueuePrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.ENQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        entityId: userId,
        meta: {
          userId,
          authorizationId,
          eventKey,
          eventType,
          enqueued,
          jobId: existingJob.id,
        },
      });

      return {
        jobId: existingJob.id,
        enqueued,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to enqueue CRM sync job from backfill',
        context: CrmSyncEnqueuePrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.ENQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        entityId: userId,
        meta: {
          userId,
          authorizationId,
          eventKey,
          eventType,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to enqueue CRM sync job from backfill',
        {
          userId,
          authorizationId,
          eventKey,
          eventType,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
