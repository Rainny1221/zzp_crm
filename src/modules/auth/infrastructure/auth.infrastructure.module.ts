import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { I_AUTH_REPOSITORY } from '../domain/repositories/i-auth.repository';
import { I_TOKEN_SERVICE } from '../domain/services/i-token.service';
import { AuthPrismaRepository } from './persistence/auth.prisma-repository';
import { JwtTokenService } from './services/jwt-token.service';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    {
      provide: I_AUTH_REPOSITORY,
      useClass: AuthPrismaRepository,
    },
    {
      provide: I_TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [I_AUTH_REPOSITORY, I_TOKEN_SERVICE],
})
export class AuthInfrastructureModule {}
