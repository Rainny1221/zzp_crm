import { Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CRM_SYNC_LOG } from '../../domain/crm-sync.constants';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
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

  async tryStartProcessing(id: number): Promise<CrmSyncEntity | null> {
    const now = new Date();

    try {
      const rows = await this.prisma.crmSyncJobs.updateManyAndReturn({
        where: {
          id,
          status: { in: ['PENDING', 'FAILED'] },
        },
        data: {
          status: 'PROCESSING',
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

  async markSuccess(id: number): Promise<void> {
    try {
      await this.prisma.crmSyncJobs.update({
        where: { id },
        data: {
          status: 'SUCCESS',
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
      const current = await this.prisma.crmSyncJobs.findUnique({
        where: { id },
        select: { retry_count: true },
      });

      await this.prisma.crmSyncJobs.update({
        where: { id },
        data: {
          status: 'FAILED',
          retry_count: (current?.retry_count ?? 0) + 1,
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
