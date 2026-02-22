import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.config';
import { createMorganMiddleware } from './logger/morgan.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = WinstonModule.createLogger(winstonConfig);
  app.useLogger(logger);

  app.use(createMorganMiddleware(logger));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();