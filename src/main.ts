import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { apiCompatMiddleware } from './common/middleware/api-compat.middleware';
import { loadEnvFiles } from './lib/load-env';

loadEnvFiles();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'test' ? false : undefined,
  });

  app.use(apiCompatMiddleware);

  const uploadDir = process.env.UPLOAD_DIR ?? '/var/gestao-api/uploads';
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (corsOrigins?.length) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  } else {
    app.enableCors();
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3060);
  const host = process.env.HOST ?? '127.0.0.1';

  await app.listen(port, host);
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { bootstrap };
