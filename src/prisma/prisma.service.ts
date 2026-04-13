import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { ErrorFactory } from 'src/common/error.factory';
import { ErrorCode } from 'src/common/enums/error-codes.enum';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter, log: ['warn', 'error'] });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error);
      throw ErrorFactory.create(
        ErrorCode.DATABASE_CONNECTION_ERROR,
        'Failed to connect to the database',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
