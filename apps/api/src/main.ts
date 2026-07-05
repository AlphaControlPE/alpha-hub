import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Cabeçalhos de segurança (P0). CSP/CORP desligados: a API é cross-origin
  // do site e serve o Swagger; o CORS abaixo controla o acesso do frontend.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
  // Atrás do proxy do Render — usa o IP real (X-Forwarded-For) no rate-limit.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Alpha Hub API')
    .setDescription('Marketplace gratuito — núcleo modular, API-first, auditável.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Alpha Hub API em http://localhost:${port}/api (docs em /api/docs)`);
}

void bootstrap();
