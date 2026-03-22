import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MatchingInfrastructureModule } from '../infrastructure/matching.infrastructure.module';
import { GetMatchingHandler } from './queries';
import { CreateMatchingHandler } from './commands';

const QueryHandlers = [GetMatchingHandler];
const CommandHandlers = [CreateMatchingHandler];

@Module({
  imports: [CqrsModule, MatchingInfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class MatchingApplicationModule {}
