# gestao-api

Backend dedicado da **gestão da igreja** (PIB Roraima): membros, escalas, feed, visitantes, permissões, push e integrações.

| Item | Valor |
|------|--------|
| **Status** | Documentação + scaffold — implementação pendente |
| **Banco** | Postgres `pibrr_gestao` na VPS (`31.97.169.130:5433`) |
| **Hospedagem alvo** | VPS + PM2 + nginx (mesmo padrão `school-backend`, `caixa-api`) |
| **URL produção (planejada)** | `https://gestao-api.pibrr.com` |
| **Consumidores** | `pib-app` (Expo), futuro `gestao-web`, transição de `pibrr` (Next na Vercel) |

## Documentação

Leia na ordem:

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [docs/01-visao-e-escopo.md](./docs/01-visao-e-escopo.md) | Produto, fronteiras, o que **não** entra |
| 2 | [docs/02-system-design.md](./docs/02-system-design.md) | Arquitetura, diagramas, fluxos |
| 3 | [docs/03-stack-e-estrutura.md](./docs/03-stack-e-estrutura.md) | Fastify, pastas, convenções de código |
| 4 | [docs/04-banco-dados-vps.md](./docs/04-banco-dados-vps.md) | `pibrr_gestao`, secrets, conexão |
| 5 | [docs/05-autenticacao-e-permissoes.md](./docs/05-autenticacao-e-permissoes.md) | JWT mobile, web, roles, accounts |
| 6 | [docs/06-modulos-e-api-v1.md](./docs/06-modulos-e-api-v1.md) | Catálogo completo de endpoints |
| 7 | [docs/07-regras-de-negocio.md](./docs/07-regras-de-negocio.md) | Regras por domínio |
| 8 | [docs/08-infraestrutura-vps.md](./docs/08-infraestrutura-vps.md) | PM2, nginx, portas, logs |
| 9 | [docs/09-deploy-github-actions.md](./docs/09-deploy-github-actions.md) | CI/CD, secrets, rollback |
| 10 | [docs/10-variaveis-ambiente.md](./docs/10-variaveis-ambiente.md) | `.env` completo |
| 11 | [docs/11-migracao-desde-pibrr.md](./docs/11-migracao-desde-pibrr.md) | Extração incremental do Next |
| 12 | [docs/12-roadmap-implementacao.md](./docs/12-roadmap-implementacao.md) | Fases, checklist, critérios de pronto |

## Origem do código

Hoje a API vive em `pibrr/app/api/*` + `pibrr/lib/*` (Next.js na Vercel, banco na VPS). Este repositório é o destino da **extração** descrita em [docs/11-migracao-desde-pibrr.md](./docs/11-migracao-desde-pibrr.md).

## Referências no workspace

- Visão geral: `../docs/03-arquitetura-alvo.md`
- Migração banco: `../docs/15-migracao-neon-vps-gestao.md`
- API atual (legado): `../pibrr/docs/API.md`
- App mobile: `../pib-app/`
- Vendas (domínio separado): `../vendas-pibrr/`

## Desenvolvimento local (quando implementado)

```bash
cp .env.example .env
npm ci
npm run dev
```

## Deploy

Push em `main` dispara `.github/workflows/deploy.yml` (após configurar secrets no environment `production` do GitHub). Ver [docs/09-deploy-github-actions.md](./docs/09-deploy-github-actions.md).
