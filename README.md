# gestao-api

Backend dedicado da **gestão da igreja** (PIB Roraima): membros, escalas, feed, visitantes, permissões, push e integrações.

| Item | Valor |
|------|--------|
| **Status** | API v1 no ar + compat `/api`→`/v1` — app ainda usa `www.pibrr.com` até OTA |
| **Banco** | Postgres `pibrr_gestao` na VPS (`127.0.0.1:5433`) |
| **Hospedagem** | VPS + PM2 + nginx |
| **URL produção** | `https://gestao-api.pibrr.com` |
| **Consumidores (após cutover)** | `pib-app`, futuro `gestao-web`, `pibrr` |

## Quick check

```bash
curl -s https://gestao-api.pibrr.com/health
# {"status":"ok","db":"connected","version":"0.1.0"}
```

Go-live / o que falta (GitHub secrets, OAuth): [docs/13-go-live-checklist.md](./docs/13-go-live-checklist.md)

## Documentação

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [docs/01-visao-e-escopo.md](./docs/01-visao-e-escopo.md) | Produto, fronteiras |
| 2 | [docs/02-system-design.md](./docs/02-system-design.md) | Arquitetura |
| 3 | [docs/03-stack-e-estrutura.md](./docs/03-stack-e-estrutura.md) | NestJS, pastas |
| 4 | [docs/04-banco-dados-vps.md](./docs/04-banco-dados-vps.md) | `pibrr_gestao` |
| 5 | [docs/05-autenticacao-e-permissoes.md](./docs/05-autenticacao-e-permissoes.md) | JWT, roles |
| 6 | [docs/06-modulos-e-api-v1.md](./docs/06-modulos-e-api-v1.md) | Catálogo de endpoints |
| 7 | [docs/07-regras-de-negocio.md](./docs/07-regras-de-negocio.md) | Regras |
| 8 | [docs/08-infraestrutura-vps.md](./docs/08-infraestrutura-vps.md) | PM2, nginx |
| 9 | [docs/09-deploy-github-actions.md](./docs/09-deploy-github-actions.md) | CI/CD |
| 10 | [docs/10-variaveis-ambiente.md](./docs/10-variaveis-ambiente.md) | Env vars |
| 11 | [docs/11-migracao-desde-pibrr.md](./docs/11-migracao-desde-pibrr.md) | Extração do Next |
| 12 | [docs/12-roadmap-implementacao.md](./docs/12-roadmap-implementacao.md) | Fases |
| 13 | [docs/13-go-live-checklist.md](./docs/13-go-live-checklist.md) | Pré-cutover + passos manuais |

## Desenvolvimento local

```bash
cp .env.example .env
# Túnel: ssh -L 5433:127.0.0.1:5433 root@31.97.169.130
npm ci
npm run dev
```

## Deploy

Push em `main` → `.github/workflows/deploy.yml` (environment `ENV` com secrets `VPS_*`).
