# 13 — Go-live checklist (pré-cutover)

Status em 2026-08-29: **API no ar**, app **ainda** em `www.pibrr.com` (sem cutover).

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

1. Abra o environment **`ENV`** (já existe).
2. Em **Environment secrets**, adicione (mesmos valores do `school-backend`):

| Secret | Valor |
|--------|--------|
| `VPS_HOST` | `31.97.169.130` |
| `VPS_USER` | `root` (ou o mesmo de school-backend) |
| `VPS_SSH_KEY` | chave privada SSH de deploy **ou** |
| `VPS_PASSWORD` | senha SSH (school-backend usa esta) |
| `VPS_PORT` | `22` (opcional) |

Referência: https://github.com/mitchelson/school-backend/settings/environments

Depois de salvar, rode **Actions → Deploy → Run workflow** (ou faça um push em `main`) e confira se o job **Build & Deploy** sobe artefatos para a VPS.

### 2) Vercel → preencher OAuth no secret da VPS

O `vercel env pull` **não** entrega variáveis **Sensitive**. Copie do painel:

https://vercel.com/mitchelsons-projects/v0-primeira-igreja-batista/settings/environment-variables

Na VPS:

```bash
ssh root@31.97.169.130
nano /root/.secrets/gestao_api_env
```

Preencha (Production):

| Variável na VPS | Origem Vercel |
|-----------------|---------------|
| `AUTH_GOOGLE_ID` | `AUTH_GOOGLE_ID` |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` | mesmo nome |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` | mesmo nome |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` | mesmo nome |
| `GOOGLE_CLIENT_IDS` | os 4 IDs acima, separados por vírgula |
| `APPLE_CLIENT_ID` | `APPLE_CLIENT_ID` |
| `FIREBASE_PROJECT_ID` | `FIREBASE_PROJECT_ID` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON completo (uma linha ou escapado) |
| `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | opcional (push web) |

**JWT (cutover):** hoje a gestao-api tem um `AUTH_JWT_SECRET` **novo**. Antes do cutover do app, substitua `AUTH_JWT_SECRET`, `AUTH_SECRET` e `AUTH_MOBILE_SECRET` pelo **mesmo** `AUTH_SECRET` da Vercel, para tokens já emitidos continuarem válidos (ou force re-login no app).

Recarregar PM2 após editar:

```bash
bash /opt/gestao-api/deploy/post-deploy.sh
```

### 3) Teste manual (ainda sem cutover)

```bash
curl -s https://gestao-api.pibrr.com/health
# POST /v1/auth/mobile com idToken Google (depois de preencher os Client IDs)
```

App / site **não** mudam ainda.

## Cutover (NÃO fazer agora)

Quando quiser:

1. Alinhar `AUTH_JWT_SECRET` com Vercel `AUTH_SECRET`
2. OTA `pib-app`: `EXPO_PUBLIC_API_URL=https://gestao-api.pibrr.com`
3. Depois: web `pibrr` → BFF / `GESTAO_API_URL`
4. Remover rotas `/api` do Next quando estável

## Comandos úteis na VPS

```bash
pm2 status gestao-api
pm2 logs gestao-api --lines 50
curl -s http://127.0.0.1:3060/health
```
