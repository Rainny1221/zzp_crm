import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bullmq';
import { Global, INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RequestContextModule } from '../src/common/context/infrastructure/request-context.module';
import { AppLoggerService } from '../src/logger/app-logger.service';
import { CrmSyncModule } from '../src/modules/crm-sync/crm-sync.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  CRM_PRODUCT_PACKAGE_OPTIONS,
  CRM_SYNC_QUEUE,
  CRM_SYNC_DEFAULTS,
  CRM_SYNC_EVENT_TYPE,
  CRM_SYNC_JOB_STATUS,
  type CrmSyncJobStatus,
} from '../src/modules/crm-sync/domain/crm-sync.constants';
import { CrmSyncQueueBootstrap } from '../src/modules/crm-sync/infrastructure/queue/crm-sync-queue.bootstrap';
import { CrmSyncQueueProcessor } from '../src/modules/crm-sync/infrastructure/queue/crm-sync-queue.processor';

interface ProcessJobResponse {
  id: number;
  status: CrmSyncJobStatus;
  skipped?: boolean;
  result?: {
    customerProfileId: number;
    dealId: number;
    pipelineRecordId: number | null;
  };
}

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const queueMock = {
  name: CRM_SYNC_QUEUE.NAME,
  metaValues: {
    version: 'bullmq-test',
  },
  add: jest.fn(),
};

@Global()
@Module({
  providers: [
    {
      provide: AppLoggerService,
      useValue: loggerMock,
    },
    {
      provide: WINSTON_MODULE_NEST_PROVIDER,
      useValue: loggerMock,
    },
  ],
  exports: [AppLoggerService, WINSTON_MODULE_NEST_PROVIDER],
})
class TestLoggerModule {}

describe('CrmSyncController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIdsToCleanup: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        BullBoardModule.forRoot({
          route: '/admin/queues',
          adapter: ExpressAdapter,
        }),
        RequestContextModule,
        TestLoggerModule,
        CrmSyncModule,
      ],
    })
      .overrideProvider(getQueueToken(CRM_SYNC_QUEUE.NAME))
      .useValue(queueMock)
      .overrideProvider(CrmSyncQueueBootstrap)
      .useValue({
        onModuleInit: jest.fn(),
      })
      .overrideProvider(CrmSyncQueueProcessor)
      .useValue({
        process: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService, { strict: false });

    await app.init();
    await seedCrmDefaults();
  });

  afterEach(async () => {
    await cleanupUsers(userIdsToCleanup.splice(0));
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('processes a pending CRM sync job for a newly inserted user', async () => {
    const { userId, jobId } = await createUserWithPendingJob();

    const response = await processJob(jobId);

    expect(response).toMatchObject({
      id: jobId,
      status: CRM_SYNC_JOB_STATUS.SUCCESS,
    });
    expect(response.skipped).toBeUndefined();
    expect(response.result).toBeDefined();

    if (!response.result) {
      throw new Error('Expected CRM sync result to be defined');
    }

    expect(typeof response.result.customerProfileId).toBe('number');
    expect(typeof response.result.dealId).toBe('number');
    expect(typeof response.result.pipelineRecordId).toBe('number');

    const state = await getCrmState(userId);

    expect(state.profiles).toHaveLength(1);
    expect(state.deals).toHaveLength(1);
    expect(state.pipelineRecords).toHaveLength(1);
    expect(state.profiles[0].customer_tier_code).toBeNull();
    expect(state.deals[0].product_package_code).toBe(
      CRM_SYNC_DEFAULTS.PRODUCT_PACKAGE_CODE,
    );
    expect(state.job?.status).toBe(CRM_SYNC_JOB_STATUS.SUCCESS);
    expect(state.job?.processed_at).toBeInstanceOf(Date);
  });

  it('replays the same CRM sync job without duplicating CRM rows', async () => {
    const { userId, jobId } = await createUserWithPendingJob();

    await processJob(jobId);
    const beforeReplay = await getCrmState(userId);

    const replayResponse = await processJob(jobId);
    const afterReplay = await getCrmState(userId);

    expect(replayResponse.id).toBe(jobId);
    expect(
      replayResponse.skipped === true ||
        replayResponse.status === CRM_SYNC_JOB_STATUS.SUCCESS,
    ).toBe(true);

    expect(afterReplay.profiles).toHaveLength(1);
    expect(afterReplay.deals).toHaveLength(1);
    expect(afterReplay.pipelineRecords).toHaveLength(1);
    expect(afterReplay.profiles.map((profile) => profile.id)).toEqual(
      beforeReplay.profiles.map((profile) => profile.id),
    );
    expect(afterReplay.deals.map((deal) => deal.id)).toEqual(
      beforeReplay.deals.map((deal) => deal.id),
    );
    expect(afterReplay.pipelineRecords.map((record) => record.id)).toEqual(
      beforeReplay.pipelineRecords.map((record) => record.id),
    );
    expect(afterReplay.job?.status).toBe(CRM_SYNC_JOB_STATUS.SUCCESS);
  });

  it('claims only one job when two process requests run concurrently', async () => {
    const { userId, jobId } = await createUserWithPendingJob();

    const responses = await Promise.all([processJob(jobId), processJob(jobId)]);

    const successfulResponses = responses.filter(
      (response) =>
        response.status === CRM_SYNC_JOB_STATUS.SUCCESS &&
        response.skipped !== true,
    );
    const skippedResponses = responses.filter(
      (response) => response.skipped === true,
    );

    expect(successfulResponses).toHaveLength(1);
    expect(skippedResponses).toHaveLength(1);

    const state = await getCrmState(userId);

    expect(state.profiles).toHaveLength(1);
    expect(state.deals).toHaveLength(1);
    expect(state.pipelineRecords).toHaveLength(1);
    expect(state.job?.status).toBe(CRM_SYNC_JOB_STATUS.SUCCESS);
  });

  async function seedCrmDefaults(): Promise<void> {
    await prisma.crmSources.upsert({
      where: { code: CRM_SYNC_DEFAULTS.SOURCE_CODE },
      update: {
        label: CRM_SYNC_DEFAULTS.SOURCE_CODE,
        is_active: true,
      },
      create: {
        code: CRM_SYNC_DEFAULTS.SOURCE_CODE,
        label: CRM_SYNC_DEFAULTS.SOURCE_CODE,
        is_active: true,
      },
    });

    for (const productPackage of CRM_PRODUCT_PACKAGE_OPTIONS) {
      await prisma.crmProductPackages.upsert({
        where: { code: productPackage.code },
        update: {
          label: productPackage.label,
          sort_order: productPackage.sortOrder,
          is_active: productPackage.isActive,
        },
        create: {
          code: productPackage.code,
          label: productPackage.label,
          sort_order: productPackage.sortOrder,
          is_active: productPackage.isActive,
        },
      });
    }

    await prisma.crmPipelineStages.upsert({
      where: { code: CRM_SYNC_DEFAULTS.PIPELINE_STAGE },
      update: {
        label: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
        stage_order: 1,
        mapped_status_code: CRM_SYNC_DEFAULTS.PIPELINE_MAPPED_STATUS_CODE,
        is_terminal: false,
        is_active: true,
      },
      create: {
        code: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
        label: CRM_SYNC_DEFAULTS.PIPELINE_STAGE,
        stage_order: 1,
        mapped_status_code: CRM_SYNC_DEFAULTS.PIPELINE_MAPPED_STATUS_CODE,
        is_terminal: false,
        is_active: true,
      },
    });
  }

  async function createUserWithPendingJob(): Promise<{
    userId: number;
    jobId: number;
  }> {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await prisma.user.create({
      data: {
        email: `crm-sync-${suffix}@example.test`,
        username: `crm-sync-${suffix}`,
        first_name: 'CRM',
        last_name: 'Sync',
        is_active: true,
        is_block: false,
        phone_number: `090${Math.floor(Math.random() * 10000000)
          .toString()
          .padStart(7, '0')}`,
      },
    });

    userIdsToCleanup.push(user.id);

    const job = await prisma.crmSyncJobs.findFirst({
      where: {
        user_id: user.id,
        event_type: CRM_SYNC_EVENT_TYPE.USER_CREATED,
      },
      orderBy: { id: 'desc' },
    });

    expect(job).not.toBeNull();
    expect(job?.status).toBe(CRM_SYNC_JOB_STATUS.PENDING);

    return {
      userId: user.id,
      jobId: job!.id,
    };
  }

  async function processJob(jobId: number): Promise<ProcessJobResponse> {
    const httpServer = app.getHttpServer() as unknown as App;
    const response = await request(httpServer)
      .post(`/internal/crm-sync/process/${jobId}`)
      .expect(201);

    return response.body as ProcessJobResponse;
  }

  async function getCrmState(userId: number) {
    const [job, profiles] = await Promise.all([
      prisma.crmSyncJobs.findFirst({
        where: { user_id: userId },
        orderBy: { id: 'desc' },
      }),
      prisma.crmCustomerProfiles.findMany({
        where: { user_id: userId },
        orderBy: { id: 'asc' },
      }),
    ]);

    const profileIds = profiles.map((profile) => profile.id);
    const deals = profileIds.length
      ? await prisma.crmDeals.findMany({
          where: { customer_id: { in: profileIds } },
          orderBy: { id: 'asc' },
        })
      : [];
    const dealIds = deals.map((deal) => deal.id);
    const pipelineRecords = dealIds.length
      ? await prisma.crmPipelineRecords.findMany({
          where: { deal_id: { in: dealIds } },
          orderBy: { id: 'asc' },
        })
      : [];

    return {
      job,
      profiles,
      deals,
      pipelineRecords,
    };
  }

  async function cleanupUsers(userIds: number[]): Promise<void> {
    for (const userId of userIds) {
      const profiles = await prisma.crmCustomerProfiles.findMany({
        where: { user_id: userId },
        select: { id: true },
      });
      const profileIds = profiles.map((profile) => profile.id);
      const deals = profileIds.length
        ? await prisma.crmDeals.findMany({
            where: { customer_id: { in: profileIds } },
            select: { id: true },
          })
        : [];
      const dealIds = deals.map((deal) => deal.id);

      if (dealIds.length) {
        await prisma.crmPipelineRecords.deleteMany({
          where: { deal_id: { in: dealIds } },
        });
      }

      if (profileIds.length) {
        await prisma.crmDeals.deleteMany({
          where: { customer_id: { in: profileIds } },
        });
        await prisma.crmCustomerProfiles.deleteMany({
          where: { id: { in: profileIds } },
        });
      }

      await prisma.crmSyncJobs.deleteMany({
        where: { user_id: userId },
      });
      await prisma.crmPipelineEvents.deleteMany({
        where: {
          entity_type: 'user',
          entity_id: userId,
        },
      });
      await prisma.user.deleteMany({
        where: { id: userId },
      });
    }
  }
});
