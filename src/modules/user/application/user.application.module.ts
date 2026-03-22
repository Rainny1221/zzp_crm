import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserInfrastructureModule } from '../infrastructure/user.infrastructure.module';
import { GetUserByIdHandler, GetUserByEmailHandler } from './queries';
import { UpdateProfileHandler, UpdateAvatarHandler } from './commands';

const QueryHandlers = [GetUserByIdHandler, GetUserByEmailHandler];
const CommandHandlers = [UpdateProfileHandler, UpdateAvatarHandler];

@Module({
  imports: [CqrsModule, UserInfrastructureModule],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class UserApplicationModule {}
