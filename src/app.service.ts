import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly prisma: PrismaService) {}
  getHello() {
    this.logger.log('Hello World');
    this.logger.error('Error');
    this.logger.warn('Warn');
    this.logger.debug('Debug');
    this.logger.verbose('Verbose');
    return this.prisma.user.findMany();
  }
}
