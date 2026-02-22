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
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';

@Module({
  imports: [
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
    RedisModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}