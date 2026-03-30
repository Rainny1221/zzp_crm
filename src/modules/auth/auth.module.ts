import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthDomainModule } from './domain/auth.domain.module';
import { AuthInfrastructureModule } from './infrastructure/auth.infrastructure.module';
import { AuthApplicationModule } from './application/auth.application.module';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    JwtModule.register({}),
    AuthDomainModule,
    AuthInfrastructureModule,
    AuthApplicationModule,
  ],
  controllers: [AuthController],
  providers: [],
  exports: [AuthApplicationModule, AuthInfrastructureModule],
})
export class AuthModule {}
