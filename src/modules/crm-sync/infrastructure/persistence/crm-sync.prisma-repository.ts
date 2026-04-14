import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma/client';
import {
  CRM_SYNC_JOB_STATUS,
  CRM_SYNC_LOG,
  CRM_SYNC_PROCESSABLE_STATUSES,
} from '../../domain/crm-sync.constants';
import type {
  FindCrmSyncJobsParams,
  FindCrmSyncJobsResult,
  ICrmSyncRepository,
} from '../../domain/repositories/i-crm-sync.repository';
import { CrmSyncEntity } from '../../domain/entities/crm-sync.entity';
import { CrmSyncPrismaMapper } from './crm-sync.prisma-mapper';

@Injectable()
export class CrmSyncPrismaRepository implements ICrmSyncRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findById(id: number): Promise<CrmSyncEntity | null> {
    try {
      const job = await this.prisma.crmSyncJobs.findUnique({
        where: { id },
      });

      if (!job) return null;

      return CrmSyncPrismaMapper.toDomain(job);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to find CRM sync job',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.FIND_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: id,
        meta: {
          jobId: id,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to find CRM sync job',
        {
          jobId: id,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async findMany(
    params: FindCrmSyncJobsParams,
  ): Promise<FindCrmSyncJobsResult> {
    const where: Prisma.CrmSyncJobsWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.eventType ? { event_type: params.eventType } : {}),
    };
    const skip = (params.page - 1) * params.limit;

    try {
      const [items, total] = await Promise.all([
        this.prisma.crmSyncJobs.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: params.limit,
        }),
        this.prisma.crmSyncJobs.count({ where }),
      ]);

      this.logger.debug({
        message: 'CRM sync jobs listed',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.LIST_JOBS,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        meta: {
          filters: params,
          total,
          itemCount: items.length,
        },
      });

      return {
        items: items.map((job) => CrmSyncPrismaMapper.toDomain(job)),
        total,
      };
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to list CRM sync jobs',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.LIST_JOBS,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        meta: {
          filters: params,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to list CRM sync jobs',
        {
          filters: params,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async findPendingBatch(limit: number): Promise<CrmSyncEntity[]> {
    try {
      const jobs = await this.prisma.crmSyncJobs.findMany({
        where: { status: CRM_SYNC_JOB_STATUS.PENDING },
        orderBy: { created_at: 'asc' },
        take: limit,
      });

      this.logger.debug({
        message: 'CRM sync pending jobs batch listed',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.DISPATCH_PENDING_JOBS,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        meta: {
          limit,
          count: jobs.length,
        },
      });

      return jobs.map((job) => CrmSyncPrismaMapper.toDomain(job));
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to list CRM sync pending jobs batch',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.DISPATCH_PENDING_JOBS,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        meta: {
          limit,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to list CRM sync pending jobs batch',
        {
          limit,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async tryStartProcessing(id: number): Promise<CrmSyncEntity | null> {
    const now = new Date();

    try {
      const rows = await this.prisma.crmSyncJobs.updateManyAndReturn({
        where: {
          id,
          status: { in: CRM_SYNC_PROCESSABLE_STATUSES },
        },
        data: {
          status: CRM_SYNC_JOB_STATUS.PROCESSING,
          locked_at: now,
          updated_at: now,
        },
      });

      if (!rows.length) return null;

      const job = rows[0];

      this.logger.debug({
        message: 'CRM sync job claimed for processing',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.CLAIM_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: id,
        meta: {
          jobId: id,
          lockedAt: now.toISOString(),
        },
      });

      return CrmSyncPrismaMapper.toDomain(job);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to claim CRM sync job for processing',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.CLAIM_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: id,
        meta: {
          jobId: id,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to claim CRM sync job for processing',
        {
          jobId: id,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async requeue(id: number): Promise<CrmSyncEntity | null> {
    try {
      const rows = await this.prisma.crmSyncJobs.updateManyAndReturn({
        where: {
          id,
          status: CRM_SYNC_JOB_STATUS.FAILED,
        },
        data: {
          status: CRM_SYNC_JOB_STATUS.PENDING,
          locked_at: null,
          processed_at: null,
          last_error: null,
        },
      });

      if (!rows.length) return null;

      const job = rows[0];

      this.logger.info({
        message: 'CRM sync job requeued',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.REQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: id,
        meta: {
          jobId: id,
        },
      });

      return CrmSyncPrismaMapper.toDomain(job);
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to requeue CRM sync job',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.REQUEUE_JOB,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: id,
        meta: {
          jobId: id,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to requeue CRM sync job',
        {
          jobId: id,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async markSuccess(id: number): Promise<void> {
    try {
      await this.prisma.crmSyncJobs.update({
        where: { id },
        data: {
          status: CRM_SYNC_JOB_STATUS.SUCCESS,
          processed_at: new Date(),
          last_error: null,
        },
      });
    } catch (error: unknown) {
      this.logger.error({
        message: 'Failed to mark CRM sync job as successful',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.MARK_SUCCESS,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: id,
        meta: {
          jobId: id,
          error: toErrorMeta(error),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to mark CRM sync job as successful',
        {
          jobId: id,
          error: toErrorMeta(error),
        },
      );
    }
  }

  async markFailed(id: number, error: string): Promise<void> {
    try {
      await this.prisma.crmSyncJobs.update({
        where: { id },
        data: {
          status: CRM_SYNC_JOB_STATUS.FAILED,
          retry_count: {
            increment: 1,
          },
          last_error: error,
        },
      });
    } catch (markFailedError: unknown) {
      this.logger.error({
        message: 'Failed to mark CRM sync job as failed',
        context: CrmSyncPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.MARK_FAILED,
        entityType: CRM_SYNC_LOG.ENTITIES.JOB,
        entityId: id,
        meta: {
          jobId: id,
          originalError: error,
          error: toErrorMeta(markFailedError),
        },
      });

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_REPOSITORY_ERROR,
        'Failed to mark CRM sync job as failed',
        {
          jobId: id,
          originalError: error,
          error: toErrorMeta(markFailedError),
        },
      );
    }
  }
}
