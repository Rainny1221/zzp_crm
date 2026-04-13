import { CrmSyncJobs, Prisma } from 'src/generated/prisma/client';
import { CrmSyncEntity } from '../../domain/entities/crm-sync.entity';

type PrismaCrmSyncJobRaw = Pick<
  CrmSyncJobs,
  | 'id'
  | 'event_key'
  | 'event_type'
  | 'user_id'
  | 'payload'
  | 'status'
  | 'retry_count'
  | 'last_error'
  | 'created_at'
  | 'updated_at'
  | 'locked_at'
  | 'processed_at'
>;

export class CrmSyncPrismaMapper {
  static toDomain(model: PrismaCrmSyncJobRaw): CrmSyncEntity {
    return new CrmSyncEntity(
      model.id,
      model.event_key,
      model.event_type,
      model.user_id,
      CrmSyncPrismaMapper.toDomainPayload(model.payload),
      model.status,
      model.retry_count,
      model.last_error ?? null,
      model.created_at,
      model.updated_at,
      model.locked_at ?? null,
      model.processed_at ?? null,
    );
  }

  static toUpdatePersistence(
    entity: CrmSyncEntity,
  ): Prisma.CrmSyncJobsUncheckedUpdateInput {
    return {
      payload: CrmSyncPrismaMapper.toPersistencePayload(entity.payload),
      status: entity.status,
      retry_count: entity.retryCount,
      last_error: entity.lastError,
      locked_at: entity.lockedAt,
      processed_at: entity.processedAt,
      updated_at: entity.updatedAt,
    };
  }

  private static toDomainPayload(
    payload: CrmSyncJobs['payload'],
  ): Record<string, unknown> | null {
    if (
      payload !== null &&
      typeof payload === 'object' &&
      !Array.isArray(payload)
    ) {
      return payload as Record<string, unknown>;
    }

    return null;
  }

  private static toPersistencePayload(
    payload: Record<string, unknown> | null,
  ): Prisma.CrmSyncJobsUncheckedUpdateInput['payload'] {
    if (payload === null) {
      return Prisma.JsonNull;
    }

    return payload as Prisma.InputJsonValue;
  }
}
