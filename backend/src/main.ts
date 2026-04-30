import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global pipes ────────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // ── CORS for NextJS dev server ──────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  });

  // ── Swagger / OpenAPI ──────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('The Orbit API')
    .setDescription('Spatial music discovery — NestJS backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 The Orbit API running at http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api`);
}

bootstrap();
