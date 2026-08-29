import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'test' ? false : undefined,
  });

  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

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
