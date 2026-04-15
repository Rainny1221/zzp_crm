import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics/prometheus.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import { CacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import { UserModule } from './modules/user/user.module';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';
import { GlobalExceptionFilter } from './common/filter/global-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuthGuard } from './common/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { AwsS3Module } from './aws-s3/aws-s3.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { FileModule } from './file/file.module';
import { PrismaModule } from './prisma/prisma.module';
import { AvatarModule } from './avatar/avatar.module';
import { ImageModule } from './image/image.module';
import { LoggerModule } from './logger/logger.module';
import { RequestContextModule } from './common/context/infrastructure/request-context.module';
import { CrmSyncModule } from './modules/crm-sync/crm-sync.module';
import { CrmBootstrapModule } from './modules/crm-bootstrap/crm-bootstrap.module';
import { CrmCustomersModule } from './modules/crm-customers/crm-customers.module';
import { CrmPipelineModule } from './modules/crm-pipeline/crm-pipeline.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD', ''),
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redisClient: Redis) => {
        const store = new KeyvRedis(redisClient as any);

        return {
          stores: [new Keyv({ store })],
          ttl: 60000,
        };
      },
    }),
    RequestContextModule,
    LoggerModule,
    MetricsModule,
    HealthModule,
    RedisModule,
    UserModule,
    AwsS3Module,
    FileModule,
    PrismaModule,
    AvatarModule,
    ImageModule,
    CrmBootstrapModule,
    CrmCustomersModule,
    CrmPipelineModule,
    CrmSyncModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
})
export class AppModule {}
