#!/usr/bin/env bash
# Pós-deploy na VPS: sync env + PM2 reload. Padrão school-backend / zenvix-store.
set -euo pipefail

APP_DIR="/opt/gestao-api"

export NVM_DIR="${NVM_DIR:-/root/.nvm}"
if [ -s "${NVM_DIR}/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "${NVM_DIR}/nvm.sh"
fi

NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
PM2_BIN="${PM2_BIN:-$(command -v pm2 || true)}"

if [ -z "${NODE_BIN}" ] || [ -z "${PM2_BIN}" ]; then
  echo "Node ou PM2 não encontrado na VPS."
  echo "Instale nvm + Node 22 + pm2 (igual school-backend)."
  exit 127
fi

echo "→ node: ${NODE_BIN} ($(${NODE_BIN} -v))"
echo "→ pm2:  ${PM2_BIN}"

cd "${APP_DIR}"

# Monta .env.production a partir dos secrets da VPS (Nest ConfigModule lê .env)
if [ ! -f /root/.secrets/gestao_api_env ]; then
  echo "❌ /root/.secrets/gestao_api_env ausente"
  exit 1
fi

{
  cat /root/.secrets/gestao_api_env
  echo
  if [ -f /root/.secrets/pibrr_gestao_database_url ]; then
    # arquivo pode ser URL pura ou export DATABASE_URL=...
    db_raw="$(tr -d '\r' < /root/.secrets/pibrr_gestao_database_url | head -1)"
    if [[ "${db_raw}" == export\ DATABASE_URL=* ]]; then
      echo "${db_raw#export }"
    elif [[ "${db_raw}" == DATABASE_URL=* ]]; then
      echo "${db_raw}"
    else
      echo "DATABASE_URL=${db_raw}"
    fi
  fi
} > .env.production

chmod 600 .env.production
ln -sf .env.production .env

export NODE_ENV=production
# JSON embutido de service account quebra `source`; use FILE path ou pule a linha.
set -a
# shellcheck disable=SC1091
source <(grep -vE "^FIREBASE_SERVICE_ACCOUNT_JSON=['\"]?\{" .env.production)
set +a

if [ -d db/migrations ] && [ -f scripts/migrate.sh ]; then
  echo "==> Rodando migrations..."
  bash scripts/migrate.sh
fi

echo "==> PM2 reload..."
"${PM2_BIN}" reload ecosystem.config.cjs --env production --update-env \
  || "${PM2_BIN}" start ecosystem.config.cjs --env production
"${PM2_BIN}" save

sleep 2
curl -sf "http://127.0.0.1:${PORT:-3060}/health" || {
  "${PM2_BIN}" logs gestao-api --lines 50 --nostream
  exit 1
}

echo "gestao-api em produção ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
