import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthInfrastructureModule } from '../infrastructure/auth.infrastructure.module';
import {
  GenerateTokensHandler,
  RefreshTokenHandler,
  LogoutHandler,
  LogoutAllDevicesHandler,
} from './commands';

const CommandHandlers = [
  GenerateTokensHandler,
  RefreshTokenHandler,
  LogoutHandler,
  LogoutAllDevicesHandler,
];

@Module({
  imports: [CqrsModule, AuthInfrastructureModule],
  providers: [...CommandHandlers],
})
export class AuthApplicationModule {}
