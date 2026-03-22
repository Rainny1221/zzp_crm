import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { I_USER_REPOSITORY } from '../domain/repositories/i-user.repository';
import { UserPrismaRepository } from './persistence/user.prisma-repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: I_USER_REPOSITORY,
      useClass: UserPrismaRepository,
    },
  ],
  exports: [I_USER_REPOSITORY],
})
export class UserInfrastructureModule {}
