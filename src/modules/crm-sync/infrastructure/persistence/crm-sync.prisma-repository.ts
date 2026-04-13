// src/modules/crm-sync/infrastructure/persistence/crm-sync.prisma-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { ICrmSyncRepository } from '../../domain/repositories/i-crm-sync.repository';
import { CrmSyncEntity } from '../../domain/entities/crm-sync.entity';

@Injectable()
export class CrmSyncPrismaRepository implements ICrmSyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<CrmSyncEntity | null> {
    const job = await this.prisma.crmSyncJobs.findUnique({
      where: { id },
    });

    if (!job) return null;

    return new CrmSyncEntity(
      job.id,
      job.event_key,
      job.event_type,
      job.user_id,
      (job.payload as Record<string, unknown> | null) ?? null,
      job.status,
      job.retry_count,
      job.last_error,
      job.created_at,
      job.updated_at,
      job.locked_at,
      job.processed_at,
    );
  }

  async markProcessing(id: number): Promise<void> {
    await this.prisma.crmSyncJobs.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        locked_at: new Date(),
      },
    });
  }

  async markSuccess(id: number): Promise<void> {
    await this.prisma.crmSyncJobs.update({
      where: { id },
      data: {
        status: 'SUCCESS',
        processed_at: new Date(),
        last_error: null,
      },
    });
  }

  async markFailed(id: number, error: string): Promise<void> {
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
  }
}
