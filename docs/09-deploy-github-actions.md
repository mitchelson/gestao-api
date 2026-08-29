# 09 — Deploy via GitHub Actions

Pipeline no padrão **`mitchelson/school-backend`**: CI em todo push/PR; deploy automático na `main` após CI verde.

---

## Visão geral

```text
push/PR → ci.yml (lint, test, build)
              │
main + success → deploy.yml
              │
              ├─ build artifact (dist/)
              ├─ SCP → VPS /opt/gestao-api
              ├─ SSH post-deploy.sh
              └─ PM2 reload gestao-api
```

---

## Secrets no GitHub (repositório `gestao-api`)

| Secret | Descrição |
|--------|-----------|
| `VPS_HOST` | `31.97.169.130` |
| `VPS_USER` | `root` (ou usuário deploy dedicado) |
| `VPS_SSH_KEY` | Chave privada SSH (mesma família dos outros projetos) |
| `VPS_PORT` | `22` (opcional, default 22) |

Variáveis de runtime **não** vão no GitHub — ficam em `/root/.secrets/gestao_api_env` na VPS.

---

## Workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

Enquanto o código não existir, `lint`/`test` podem ser no-ops (`echo ok`) até Fase 1.

---

## Workflow: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha }}

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Prepare deploy bundle
        run: |
          mkdir -p deploy-bundle
          cp -r dist package.json package-lock.json ecosystem.config.cjs deploy-bundle/
          cp deploy/post-deploy.sh deploy-bundle/

      - name: Copy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          source: deploy-bundle/*
          target: /opt/gestao-api
          strip_components: 1

      - name: Run post-deploy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          script: |
            cd /opt/gestao-api
            chmod +x post-deploy.sh
            ./post-deploy.sh
```

---

## Script: `deploy/post-deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /opt/gestao-api

# Carregar secrets
set -a
[ -f /root/.secrets/gestao_api_env ] && source /root/.secrets/gestao_api_env
[ -f /root/.secrets/pibrr_gestao_database_url ] && source /root/.secrets/pibrr_gestao_database_url
set +a

export NODE_ENV=production

# Instalar deps de produção
npm ci --omit=dev

# Migrations (quando existirem)
if [ -d migrations ] && [ -f scripts/migrate.sh ]; then
  ./scripts/migrate.sh
fi

# PM2
if pm2 describe gestao-api > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

# Health check local
sleep 2
curl -sf http://127.0.0.1:3060/health || (pm2 logs gestao-api --lines 50; exit 1)

echo "Deploy OK"
```

---

## Primeiro deploy manual (bootstrap VPS)

Executar **uma vez** na VPS antes do primeiro GitHub Actions:

```bash
mkdir -p /opt/gestao-api
# Criar /root/.secrets/gestao_api_env com AUTH_JWT_SECRET, PORT=3060, etc.
# Certbot para gestao-api.zenvixlabs.app
# nginx site enabled
# pm2 startup
```

---

## Rollback

1. Reverter commit na `main` e aguardar deploy automático, **ou**
2. SSH na VPS, checkout de tag/commit anterior no bundle manual, `pm2 reload`

Manter últimas 3 releases em `/opt/gestao-api/releases/` (melhoria fase 2).

---

## Ambientes

| Ambiente | Branch | URL |
|----------|--------|-----|
| Produção | `main` | `https://gestao-api.zenvixlabs.app` |
| Staging | — | não previsto na v1 (usar branch local + túnel) |

---

## Checklist pós-deploy

- [ ] `curl https://gestao-api.zenvixlabs.app/health` → 200
- [ ] `POST /v1/auth/mobile` com token de teste
- [ ] App com `EXPO_PUBLIC_API_URL` apontando para nova URL
- [ ] Logs PM2 sem erro de conexão DB
