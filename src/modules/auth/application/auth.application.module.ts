import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthInfrastructureModule } from '../infrastructure/auth.infrastructure.module';
import {
  ValidateOAuthUserHandler,
  GenerateTokensHandler,
  RefreshTokenHandler,
  LogoutHandler,
  LogoutAllDevicesHandler,
} from './commands';

const CommandHandlers = [
  ValidateOAuthUserHandler,
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
