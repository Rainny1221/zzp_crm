import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserDomainModule } from './domain/user.domain.module';
import { UserInfrastructureModule } from './infrastructure/user.infrastructure.module';
import { UserApplicationModule } from './application/user.application.module';
import { UserController } from './presentation/user.controller';

@Module({
  imports: [
    CqrsModule,
    UserDomainModule,
    UserInfrastructureModule,
    UserApplicationModule,
  ],
  controllers: [UserController],
  exports: [UserApplicationModule, UserInfrastructureModule],
})
export class UserModule {}
