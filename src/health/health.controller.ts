import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';


@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  @Get('/ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        database: 'up',
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'not-ready',
        database: 'down',
      });
    }
  }
}