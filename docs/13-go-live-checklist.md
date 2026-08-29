# 13 — Go-live checklist (pré-cutover)

Status em 2026-08-29: **API no ar** + OAuth/Firebase na VPS + CI Deploy ok. App **ainda** em `www.pibrr.com` (sem cutover).

## Já feito (automático / VPS)

- [x] Código NestJS API v1 na `main`
- [x] `/opt/gestao-api` + PM2 `gestao-api` (porta **3060**)
- [x] Secret base `/root/.secrets/gestao_api_env` + DB `pibrr_gestao`
- [x] DNS `gestao-api.pibrr.com` → `31.97.169.130` (Vercel DNS)
- [x] nginx + Let's Encrypt HTTPS
- [x] Health: `https://gestao-api.pibrr.com/health` → `{"status":"ok","db":"connected",...}`

## O que só você pode fazer

### 1) GitHub — secrets do environment `ENV`

Repo: https://github.com/mitchelson/gestao-api/settings/environments

- [x] Environment **`ENV`** com secrets de deploy:
  - [x] `VPS_HOST` = `31.97.169.130`
  - [x] `VPS_USER` = `root`
  - [x] `VPS_PASSWORD` (igual school-backend)
  - [x] `VPS_PORT` = `22`
  - [ ] `VPS_SSH_KEY` — não usado (deploy via senha)
- [x] Actions → Deploy ok (ex.: commit Firebase FILE support)

Referência: https://github.com/mitchelson/school-backend/settings/environments

### 2) Vercel / consoles → OAuth no secret da VPS

O `vercel env pull` **não** entrega variáveis **Sensitive**. Valores vieram dos consoles Google/Apple/Firebase.

Na VPS: `/root/.secrets/gestao_api_env` (+ service account em arquivo).

| Variável na VPS | Status |
|-----------------|--------|
| `AUTH_GOOGLE_ID` | [x] |
| `AUTH_GOOGLE_SECRET` | [x] |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` | [x] |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` | [x] |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` | [x] |
| `GOOGLE_CLIENT_IDS` | [x] (iOS, Android, Web) |
| `APPLE_CLIENT_ID` | [x] (`com.zenvixlabs.pibrr`) |
| `FIREBASE_PROJECT_ID` | [x] (`pib-rr`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON_FILE` | [x] (`/root/.secrets/firebase_service_account.json`) |
| `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | [ ] opcional (push web) |

**JWT (cutover):** hoje a gestao-api tem um `AUTH_JWT_SECRET` **novo**. Antes do cutover do app, substitua `AUTH_JWT_SECRET`, `AUTH_SECRET` e `AUTH_MOBILE_SECRET` pelo **mesmo** `AUTH_SECRET` da Vercel, para tokens já emitidos continuarem válidos (ou force re-login no app).

Recarregar PM2 após editar:

```bash
bash /opt/gestao-api/deploy/post-deploy.sh
```

### 3) Teste manual (ainda sem cutover)

- [x] `curl -s https://gestao-api.pibrr.com/health` → ok
- [ ] `POST /v1/auth/mobile` com idToken Google
- [ ] (opcional) Apple / Firebase no mesmo endpoint

App / site **não** mudam ainda.

## Cutover app (quando decidir)

1. [x] Deploy gestao-api com middleware `/api`→`/v1` + `GET /v1/admin/dashboard`
2. [x] Smoke: `curl …/api/users/me` → 401 (não 404) — 2026-08-29
3. [x] `AUTH_JWT_SECRET` / `AUTH_MOBILE_SECRET` alinhados com `AUTH_SECRET` na VPS
4. [ ] Login Google real (`POST /v1/auth/mobile`) — bloqueado por env vazio no PM2 (fix em andamento)
5. [ ] OTA `pib-app`: `EXPO_PUBLIC_API_URL=https://gestao-api.pibrr.com` (paths `/api` intactos)
6. [ ] Depois: web `pibrr` → BFF / `GESTAO_API_URL`
7. [ ] Remover rotas `/api` do Next quando estável

## Comandos úteis na VPS

```bash
pm2 status gestao-api
pm2 logs gestao-api --lines 50
curl -s http://127.0.0.1:3060/health
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3060/api/users/me
```
