# 03 — Stack e estrutura do projeto

## Estrutura de pastas (alvo)

```text
gestao-api/
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── deploy/
│   ├── post-deploy.sh
│   └── backup-pre-migrate.sh
├── docs/                    # esta documentação
├── db/
│   └── migrations/          # 001_*.sql, 002_*.sql
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── logger.ts
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── ministerios/
│   │   ├── eventos/
│   │   ├── escalas/
│   │   ├── feed/
│   │   ├── visitantes/
│   │   ├── mensagens/
│   │   ├── notifications/
│   │   ├── dons-espirituais/
│   │   ├── push/
│   │   ├── upload/
│   │   └── config/
│   ├── lib/                 # portado de pibrr/lib (adaptado)
│   │   ├── permissions.ts
│   │   ├── account-roles.ts
│   │   ├── google-auth.ts
│   │   ├── apple-auth.ts
│   │   ├── firebase-auth.ts
│   │   ├── push.ts
│   │   └── dons-espirituais.ts
│   └── types/
├── test/
│   ├── integration/
│   └── unit/
├── nest-cli.json
├── ecosystem.config.cjs
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .env.example
└── README.md
```

## Convenções

| Item | Convenção |
|------|-----------|
| Arquivos | `kebab-case.ts` |
| Controllers NestJS | prefixo `@Controller('v1/<recurso>')` |
| Handlers | métodos async no service; erros via `HttpException` |
| SQL | sempre parametrizado; nunca concatenação |
| Commits | português ou inglês — frases curtas no imperativo |
| Branches | `main` protegida; features `feat/nome` |

## Scripts npm (planejados)

```json
{
  "dev": "nest start --watch",
  "build": "nest build",
  "start": "node dist/main.js",
  "test": "vitest run",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "lint": "eslint src",
  "migrate": "node scripts/migrate.js",
  "migrate:status": "node scripts/migrate.js status"
}
```

## Mapeamento de origem (`pibrr` → `gestao-api`)

| Origem (`pibrr/`) | Destino |
|-------------------|---------|
| `app/api/auth/mobile/route.ts` | `src/modules/auth/` |
| `lib/mobile-auth.ts` | `src/common/guards/jwt-auth.guard.ts` |
| `lib/mobile-auth-user.ts` | `src/modules/auth/auth.service.ts` |
| `lib/auth.ts` (NextAuth) | Fase 2 — `src/modules/auth/web/` ou BFF no Next |
| `lib/permissions.ts` | `src/lib/permissions.ts` |
| `lib/account-roles.ts` | `src/lib/account-roles.ts` |
| `app/api/**/route.ts` | `src/modules/<domínio>/` |
| `scripts/*.js` (migrations) | `db/migrations/` (consolidar) |

## Dependências principais (planejadas)

```text
@nestjs/common
@nestjs/core
@nestjs/platform-express
@nestjs/config
@nestjs/throttler
@nestjs/schedule
pg
zod
class-validator
class-transformer
jose
google-auth-library
firebase-admin
web-push
expo-server-sdk
```

## Compatibilidade com clientes existentes

Durante transição, manter **paridade de contrato** com rotas atuais em `pibrr/app/api`:

| Legado | Novo |
|--------|------|
| `POST /api/auth/mobile` | `POST /v1/auth/mobile` |
| `GET /api/escalas/minhas` | `GET /v1/escalas/minhas` |
| … | ver [06-modulos-e-api-v1.md](./06-modulos-e-api-v1.md) |

Opcional: rota de compatibilidade `/api/*` → redirect interno `/v1/*` por 1–2 releases.

## O que não portar

- `next-auth` handlers dentro da API (ficam no Next ou viram endpoints dedicados)
- `@neondatabase/serverless` / driver HTTP Neon
- Middleware Edge do Next
- PWA / service worker
