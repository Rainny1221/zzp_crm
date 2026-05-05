import { Global, INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { config as loadEnv } from 'dotenv';
import { ZodValidationPipe } from 'nestjs-zod';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GlobalExceptionFilter } from '../../../src/common/filter/global-exception.filter';
import { AuthGuard } from '../../../src/common/guards/auth.guard';
import { PermissionsGuard } from '../../../src/common/guards/permissions.guard';
import { TransformInterceptor } from '../../../src/common/interceptor/transform.interceptor';
import { AppLoggerService } from '../../../src/logger/app-logger.service';
import { CrmBootstrapModule } from '../../../src/modules/crm-bootstrap/crm-bootstrap.module';
import { CrmCustomersModule } from '../../../src/modules/crm-customers/crm-customers.module';
import { CrmDashboardModule } from '../../../src/modules/crm-dashboard/crm-dashboard.module';
import { CrmFeedbackModule } from '../../../src/modules/crm-feedback/crm-feedback.module';
import { CrmKpiModule } from '../../../src/modules/crm-kpi/crm-kpi.module';
import { CrmNotificationsModule } from '../../../src/modules/crm-notifications/crm-notifications.module';
import { CrmPipelineModule } from '../../../src/modules/crm-pipeline/crm-pipeline.module';
import { CrmRealtimeModule } from '../../../src/modules/crm-realtime/crm-realtime.module';
import { PrismaModule } from '../../../src/prisma/prisma.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

export type CrmTestApp = {
  app: INestApplication;
  prisma: PrismaService;
};

const loggerMock = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
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
class CrmTestLoggerModule {}

export async function createCrmTestApp(): Promise<CrmTestApp> {
  loadEnv({ quiet: true });
  loadEnv({ path: '.env.prisma', override: true, quiet: true });

  process.env.JWT_ACCESS_SECRET ??= 'crm-e2e-access-secret';
  process.env.JWT_SECRET ??= 'crm-e2e-jwt-secret';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      JwtModule.register({
        global: true,
        secret: process.env.JWT_SECRET,
      }),
      EventEmitterModule.forRoot(),
      CrmTestLoggerModule,
      PrismaModule,
      CrmBootstrapModule,
      CrmCustomersModule,
      CrmPipelineModule,
      CrmDashboardModule,
      CrmNotificationsModule,
      CrmFeedbackModule,
      CrmKpiModule,
      CrmRealtimeModule,
    ],
    providers: [
      {
        provide: APP_INTERCEPTOR,
        useClass: TransformInterceptor,
      },
      {
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
      },
      {
        provide: APP_GUARD,
        useClass: AuthGuard,
      },
      {
        provide: APP_GUARD,
        useClass: PermissionsGuard,
      },
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ZodValidationPipe());

  await app.init();

  return {
    app,
    prisma: moduleFixture.get(PrismaService, { strict: false }),
  };
}

export async function closeCrmTestApp(
  crmTestApp: CrmTestApp | undefined,
): Promise<void> {
  await crmTestApp?.app.close();
}
