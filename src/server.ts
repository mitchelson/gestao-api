import Fastify from 'fastify';

const port = Number(process.env.PORT ?? 3060);
const host = process.env.HOST ?? '127.0.0.1';

const app = Fastify({
  logger: process.env.NODE_ENV !== 'test',
  trustProxy: process.env.TRUST_PROXY === 'true',
});

app.get('/health', async () => ({
  status: 'ok',
  db: 'pending',
  version: process.env.npm_package_version ?? '0.1.0',
}));

app.get('/v1', async () => ({
  name: 'gestao-api',
  version: 'v1',
  docs: 'https://github.com/mitchelson/gestao-api',
}));

const start = async () => {
  await app.listen({ port, host });
};

if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}

export { app };
