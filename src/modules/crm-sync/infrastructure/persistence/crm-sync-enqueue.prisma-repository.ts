import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  buildCrmSyncEventKey,
  CRM_SYNC_EVENT_TYPE,
  CRM_SYNC_JOB_STATUS,
  CRM_SYNC_LOG,
} from '../../domain/crm-sync.constants';
import type {
  EnqueueCrmSyncJobResult,
  ICrmSyncEnqueueRepository,
} from '../../domain/repositories/i-crm-sync-enqueue.repository';

@Injectable()
export class CrmSyncEnqueuePrismaRepository implements ICrmSyncEnqueueRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findUsersMissingSyncJobs(
    limit: number,
  ): Promise<Array<{ id: number }>> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          deleted_at: null,
          crmSyncJobs: {
            none: {
              event_type: CRM_SYNC_EVENT_TYPE.USER_CREATED,
            },
          },
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: limit,
      });

      this.logger.debug({
        message: 'CRM sync backfill users listed',
        context: CrmSyncEnqueuePrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.BACKFILL,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        meta: {
          limit,
          count: users.length,
        },
      });

      return users;
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to list CRM sync backfill users',
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
        'Failed to list CRM sync backfill users',
        {
          limit,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async enqueueUserCreatedJob(
    userId: number,
  ): Promise<EnqueueCrmSyncJobResult> {
    const now = new Date();
    const eventType = CRM_SYNC_EVENT_TYPE.USER_CREATED;
    const eventKey = buildCrmSyncEventKey(eventType, userId);

    try {
      const jobs = await this.prisma.crmSyncJobs.createManyAndReturn({
        select: { id: true },
        data: {
          event_key: eventKey,
          event_type: eventType,
          user_id: userId,
          payload: {
            user_id: userId,
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
            eventKey,
            eventType,
          },
        );
      }

      const enqueued = Boolean(createdJob);

      this.logger.debug({
        message: enqueued
          ? 'CRM sync job enqueued from backfill'
          : 'CRM sync job already exists during backfill',
        context: CrmSyncEnqueuePrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.ENQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        entityId: userId,
        meta: {
          userId,
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
          eventKey,
          eventType,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
