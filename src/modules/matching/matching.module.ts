import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MatchingDomainModule } from './domain/matching.domain.module';
import { MatchingInfrastructureModule } from './infrastructure/matching.infrastructure.module';
import { MatchingApplicationModule } from './application/matching.application.module';
import { MatchingController } from './presentation/matching.controller';

@Module({
  imports: [
    CqrsModule,
    MatchingDomainModule,
    MatchingInfrastructureModule,
    MatchingApplicationModule,
  ],
  controllers: [MatchingController],
  exports: [MatchingApplicationModule, MatchingInfrastructureModule],
})
export class MatchingModule {}
