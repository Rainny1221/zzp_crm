import { Global, Module, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger('RedisModule');
        
        const redis = new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD || undefined,
          db: Number(process.env.REDIS_DB ?? 0),
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 100, 2000),
        });

        redis.on('connect', () => {
          logger.log('Redis connected successfully');
        });

        redis.on('error', (err) => {
          logger.error('Redis connection error', err.stack);
        });

        return redis;
      },
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}