import { Injectable } from '@nestjs/common';
import { BaseException } from 'src/common/base.exception';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { ErrorFactory } from 'src/common/error.factory';
import { toErrorMeta } from 'src/common/logging/application/error-meta.helper';
import type { LogEntry } from 'src/common/logging/application/log-entry';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import type { ICrmSyncWriterRepository } from '../../domain/repositories/i-crm-sync-writer.repository';
import {
  CRM_SYNC_DEFAULTS,
  CRM_SYNC_LOG,
  CRM_SYNC_TRANSACTION,
} from '../../domain/crm-sync.constants';

type SyncFromUserResult = Awaited<
  ReturnType<ICrmSyncWriterRepository['syncFromUser']>
>;

@Injectable()
export class CrmSyncWriterPrismaRepository implements ICrmSyncWriterRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async syncFromUser(userId: number): Promise<SyncFromUserResult> {
    this.logger.info({
      message: 'CRM sync from user started',
      context: CrmSyncWriterPrismaRepository.name,
      module: CRM_SYNC_LOG.MODULE,
      action: CRM_SYNC_LOG.ACTIONS.SYNC_FROM_USER,
      entityType: CRM_SYNC_LOG.ENTITIES.USER,
      entityId: userId,
      meta: {
        userId,
      },
    });

    try {
      const [user, stage, productPackage] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        }),
        this.prisma.crmPipelineStages.findUnique({
          where: { code: CRM_SYNC_DEFAULTS.PIPELINE_STAGE },
          select: { code: true, mapped_status_code: true },
        }),
        this.prisma.crmProductPackages.findUnique({
          where: { code: CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE },
          select: { code: true },
        }),
      ]);

      if (!user) {
        this.logger.warn({
          message: 'CRM sync user not found',
          context: CrmSyncWriterPrismaRepository.name,
          module: CRM_SYNC_LOG.MODULE,
          action: CRM_SYNC_LOG.ACTIONS.SYNC_FROM_USER,
          entityType: CRM_SYNC_LOG.ENTITIES.USER,
          entityId: userId,
          meta: {
            userId,
          },
        });

        throw ErrorFactory.create(
          ErrorCode.USER_NOT_FOUND,
          `User ${userId} not found`,
          {
            userId,
          },
        );
      }

      if (!stage) {
        this.logger.error({
          message: 'CRM sync pipeline stage not found',
          context: CrmSyncWriterPrismaRepository.name,
          module: CRM_SYNC_LOG.MODULE,
          action: CRM_SYNC_LOG.ACTIONS.SYNC_FROM_USER,
          entityType: CRM_SYNC_LOG.ENTITIES.PIPELINE_STAGE,
          entityId: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
          meta: {
            userId,
            stageCode: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
          },
        });

        throw ErrorFactory.create(
          ErrorCode.CRM_SYNC_CONFIGURATION_ERROR,
          `Pipeline stage ${CRM_SYNC_DEFAULTS.PIPELINE_STAGE} not found`,
          {
            userId,
            stageCode: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
          },
        );
      }

      if (!productPackage) {
        this.logger.error({
          message: 'CRM sync product package not found',
          context: CrmSyncWriterPrismaRepository.name,
          module: CRM_SYNC_LOG.MODULE,
          action: CRM_SYNC_LOG.ACTIONS.SYNC_FROM_USER,
          entityType: CRM_SYNC_LOG.ENTITIES.PRODUCT_PACKAGE,
          entityId: CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE,
          meta: {
            userId,
            productPackageCode: CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE,
          },
        });

        throw ErrorFactory.create(
          ErrorCode.CRM_SYNC_CONFIGURATION_ERROR,
          `Product package ${CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE} not found`,
          {
            userId,
            productPackageCode: CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE,
          },
        );
      }

      const result = await this.prisma.$transaction<SyncFromUserResult>(
        async (tx: Prisma.TransactionClient): Promise<SyncFromUserResult> => {
          await tx.$queryRaw<Array<{ set_config: string }>>`
            SELECT set_config(
              'lock_timeout',
              ${`${CRM_SYNC_TRANSACTION.LOCK_TIMEOUT_MS}ms`},
              true
            )
          `;

          const profile = await tx.crmCustomerProfiles.upsert({
            where: { user_id: user.id },
            update: {},
            create: {
              user_id: user.id,
              source_code: CRM_SYNC_DEFAULTS.SOURCE_CODE,
              gmv_monthly: null,
              customer_tier_code: CRM_SYNC_DEFAULTS.CUSTOMER_TIER_CODE,
              owner_id: null,
            },
          });

          const deal = await tx.crmDeals.upsert({
            where: { customer_id: profile.id },
            update: {},
            create: {
              customer_id: profile.id,
              pipeline_stage_code: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
              owner_id: null,
              legacy_product_package: productPackage.code,
              product_package_code: productPackage.code,
              deal_value: 0,
              probability: CRM_SYNC_DEFAULTS.PROBABILITY,
              status: stage.mapped_status_code,
            },
          });

          const existingHistory = await tx.crmPipelineRecords.findFirst({
            where: { deal_id: deal.id },
            orderBy: { created_at: 'asc' },
          });

          let pipelineRecordId: number | null = existingHistory?.id ?? null;

          if (!existingHistory) {
            const history = await tx.crmPipelineRecords.create({
              data: {
                deal_id: deal.id,
                stage_code: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
                owner_id: null,
              },
            });

            pipelineRecordId = history.id;
          }

          return {
            customerProfileId: profile.id,
            dealId: deal.id,
            pipelineRecordId,
          };
        },
        {
          maxWait: CRM_SYNC_TRANSACTION.MAX_WAIT_MS,
          timeout: CRM_SYNC_TRANSACTION.TIMEOUT_MS,
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      this.logger.info({
        message: 'CRM sync from user completed',
        context: CrmSyncWriterPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.SYNC_FROM_USER,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        entityId: userId,
        meta: {
          userId,
          result,
        },
      });

      return result;
    } catch (error: unknown) {
      const logEntry: LogEntry = {
        message: 'CRM sync from user failed',
        context: CrmSyncWriterPrismaRepository.name,
        module: CRM_SYNC_LOG.MODULE,
        action: CRM_SYNC_LOG.ACTIONS.SYNC_FROM_USER,
        entityType: CRM_SYNC_LOG.ENTITIES.USER,
        entityId: userId,
        meta: {
          userId,
          error: toErrorMeta(error),
        },
      };

      if (error instanceof BaseException && error.getStatus() < 500) {
        this.logger.warn(logEntry);
        throw error;
      }

      this.logger.error(logEntry);

      if (error instanceof BaseException) {
        throw error;
      }

      throw ErrorFactory.create(
        ErrorCode.CRM_SYNC_PROCESSING_FAILED,
        'Failed to sync CRM data from user',
        {
          userId,
          error: toErrorMeta(error),
        },
      );
    }
  }
}
