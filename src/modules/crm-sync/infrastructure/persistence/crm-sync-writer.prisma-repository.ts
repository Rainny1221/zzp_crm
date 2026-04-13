// src/modules/crm-sync/infrastructure/persistence/crm-sync-writer.prisma-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { ICrmSyncWriterRepository } from '../../domain/repositories/i-crm-sync-writer.repository';

@Injectable()
export class CrmSyncWriterPrismaRepository implements ICrmSyncWriterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async syncFromUser(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const profile = await tx.crmCustomerProfiles.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          source_code: 'website',
          tier_code: 'trial',
          owner_id: null,
        },
      });

      const deal = await tx.crmDeals.upsert({
        where: { customer_id: profile.id },
        update: {},
        create: {
          customer_id: profile.id,
          pipeline_stage_code: 'NEW_LEAD',
          owner_id: null,
          product_package: 'starter',
          deal_value: 0,
          probability: 0,
          status: 'new',
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
            stage_code: 'NEW_LEAD',
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
    });
  }
}
