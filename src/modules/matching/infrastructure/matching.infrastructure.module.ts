import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { I_MATCHING_REPOSITORY } from '../domain/repositories/i-matching.repository';
import { MatchingPrismaRepository } from './persistence/matching.prisma-repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: I_MATCHING_REPOSITORY,
      useClass: MatchingPrismaRepository,
    },
  ],
  exports: [I_MATCHING_REPOSITORY],
})
export class MatchingInfrastructureModule {}
