import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.config';
import { MetricsModule } from './metrics/prometheus.module';
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import { CacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import { UserModule } from './user/user.module';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptor/transform.interceptor';
import { GlobalExceptionFilter } from './common/filter/global-exception.filter';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuthGuard } from './common/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    
    WinstonModule.forRoot(winstonConfig), 
    MetricsModule,
    HealthModule,
    RedisModule,
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}