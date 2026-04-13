import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createMorganMiddleware } from './logger/morgan.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppLoggerService } from './logger/app-logger.service';
import { RequestContextService } from './common/context/infrastructure/request-context.service';
import { createRequestContextMiddleware } from './common/context/infrastructure/request-context.middleware';
import { RequestContextInterceptor } from './common/context/infrastructure/request-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.use(createRequestContextMiddleware(app.get(RequestContextService)));

  app.use(createMorganMiddleware(app.get(AppLoggerService)));
  app.useGlobalInterceptors(app.get(RequestContextInterceptor));

  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The system API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập Access Token của bạn vào đây',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
