#!/usr/bin/env bash
# Pós-deploy na VPS: env + PM2 reload. Padrão school-backend / zenvix-store.
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
  exit 127
fi

echo "→ node: ${NODE_BIN} ($(${NODE_BIN} -v))"
echo "→ pm2:  ${PM2_BIN}"

cd "${APP_DIR}"

# Secrets na VPS (não vão no GitHub)
set -a
[ -f /root/.secrets/gestao_api_env ] && source /root/.secrets/gestao_api_env
[ -f /root/.secrets/pibrr_gestao_database_url ] && source /root/.secrets/pibrr_gestao_database_url
set +a

export NODE_ENV=production

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
