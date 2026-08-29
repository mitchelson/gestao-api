# 10 — Variáveis de ambiente

## Produção (VPS: `/root/.secrets/gestao_api_env`)

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `NODE_ENV` | sim | `production` | `production` |
| `PORT` | sim | Porta HTTP interna | `3060` |
| `HOST` | não | Bind address | `127.0.0.1` |
| `DATABASE_URL` | sim* | Postgres | ver secret separado |
| `AUTH_JWT_SECRET` | sim | HS256 mobile/web JWT | `openssl rand -base64 32` |
| `AUTH_MOBILE_SECRET` | não | Alias legado | mesmo valor que JWT_SECRET |
| `GOOGLE_CLIENT_IDS` | sim | IDs OAuth (iOS, Android, Web) separados por vírgula | `xxx.apps.googleusercontent.com,...` |
| `AUTH_GOOGLE_ID` | web | OAuth web client | |
| `AUTH_GOOGLE_SECRET` | web | OAuth web secret | |
| `APPLE_CLIENT_ID` | sim | Bundle ID / Service ID Apple | `com.pibrr.app` |
| `APPLE_TEAM_ID` | Apple | Team ID | |
| `APPLE_KEY_ID` | Apple | Key ID | |
| `APPLE_PRIVATE_KEY` | Apple | Conteúdo .p8 (escaped) | |
| `FIREBASE_PROJECT_ID` | opcional | Provider Firebase | |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | opcional | JSON inline ou path | |
| `CORS_ORIGINS` | sim | Origens permitidas | `https://www.pibrr.com,https://pibrr.com` |
| `TRUST_PROXY` | sim | Atrás do nginx | `true` |
| `LOG_LEVEL` | não | `info`, `debug` | `info` |
| `SENTRY_DSN` | opcional | Erros | |
| `YOUTUBE_API_KEY` | opcional | Proxy YouTube | |
| `UPLOAD_DIR` | opcional | Storage local | `/var/gestao-api/uploads` |
| `FEATURE_USE_NEW_PERMISSIONS` | não | RBAC novo | `false` |

\* `DATABASE_URL` pode vir de `/root/.secrets/pibrr_gestao_database_url` (sourced no post-deploy).

### Exemplo `gestao_api_env`

```bash
NODE_ENV=production
PORT=3060
HOST=127.0.0.1
AUTH_JWT_SECRET=<gerar>
GOOGLE_CLIENT_IDS=<ios-id>,<android-id>,<web-id>
APPLE_CLIENT_ID=com.pibrr.app
CORS_ORIGINS=https://www.pibrr.com,https://pibrr.com,exp://*
TRUST_PROXY=true
LOG_LEVEL=info
```

### Secret DB (separado)

Arquivo: `/root/.secrets/pibrr_gestao_database_url`

```bash
export DATABASE_URL="postgresql://gestao_api:SENHA@127.0.0.1:5433/pibrr_gestao"
```

---

## Desenvolvimento local (`.env`)

Copiar de `.env.example`:

```bash
cp .env.example .env
```

| Variável | Local |
|----------|-------|
| `DATABASE_URL` | Túnel SSH para VPS ou Postgres local com dump |
| `AUTH_JWT_SECRET` | qualquer string dev |
| `PORT` | `3060` |
| `CORS_ORIGINS` | `http://localhost:3000,exp://localhost:8081` |

### Túnel SSH para DB

```bash
ssh -L 5433:127.0.0.1:5433 root@31.97.169.130
# DATABASE_URL=postgresql://gestao_api:***@127.0.0.1:5433/pibrr_gestao
```

---

## Clientes (não são env da API)

| Cliente | Variável | Valor após cutover |
|---------|----------|-------------------|
| pib-app | `EXPO_PUBLIC_API_URL` | `https://gestao-api.pibrr.com` |
| pibrr web | `GESTAO_API_URL` (futuro) | mesma URL |
| gestao-web (futuro) | `NEXT_PUBLIC_API_URL` | mesma URL |

---

## Paridade com legado (`pibrr` Vercel)

Migrar os mesmos valores (não reinventar):

| Legado Vercel | gestao-api |
|---------------|------------|
| `AUTH_SECRET` / mobile secret | `AUTH_JWT_SECRET` |
| `GOOGLE_CLIENT_ID` + mobile IDs | `GOOGLE_CLIENT_IDS` |
| `APPLE_*` | `APPLE_*` |
| `DATABASE_URL` (VPS) | `DATABASE_URL` local na VPS |

**Importante:** usar o **mesmo** `AUTH_JWT_SECRET` durante cutover para tokens existentes continuarem válidos, ou forçar re-login no app.

---

## Segurança

- Nunca commitar `.env` ou secrets
- `.gitignore` inclui `.env`, `*.pem`, `service-account*.json`
- Rotação de `AUTH_JWT_SECRET` invalida todos os JWTs — planejar janela de manutenção
