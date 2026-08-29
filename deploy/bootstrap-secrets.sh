#!/usr/bin/env bash
# Gera /root/.secrets/gestao_api_env na VPS (rodar como root).
# Preenche JWT novo; Google/Apple/Firebase ficam para colar do painel Vercel.
set -euo pipefail

SECRETS_DIR=/root/.secrets
ENV_FILE="${SECRETS_DIR}/gestao_api_env"
mkdir -p "${SECRETS_DIR}"
chmod 700 "${SECRETS_DIR}"

if [ -f "${ENV_FILE}" ]; then
  echo "Já existe ${ENV_FILE} — não sobrescrevendo."
  echo "Edite manualmente ou remova o arquivo e rode de novo."
  exit 0
fi

JWT="$(openssl rand -base64 48 | tr -d '\n')"

cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
PORT=3060
HOST=127.0.0.1
TRUST_PROXY=true
LOG_LEVEL=info

# Mesmo valor no cutover: copie AUTH_SECRET da Vercel (Production) para estes três.
AUTH_JWT_SECRET=${JWT}
AUTH_SECRET=${JWT}
AUTH_MOBILE_SECRET=${JWT}

# Cole da Vercel Production (Sensitive):
# AUTH_GOOGLE_ID + EXPO_PUBLIC_GOOGLE_CLIENT_ID_{IOS,ANDROID,WEB}
GOOGLE_CLIENT_IDS=
AUTH_GOOGLE_ID=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=

APPLE_CLIENT_ID=
FIREBASE_PROJECT_ID=
# Preferir arquivo (JSON com private_key quebra `source` no bash):
FIREBASE_SERVICE_ACCOUNT_JSON_FILE=/root/.secrets/firebase_service_account.json
FIREBASE_SERVICE_ACCOUNT_JSON=

CORS_ORIGINS=https://www.pibrr.com,https://pibrr.com
UPLOAD_DIR=/var/gestao-api/uploads
FEATURE_USE_NEW_PERMISSIONS=false

VAPID_EMAIL=admin@pibrr.com
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
EOF

chmod 600 "${ENV_FILE}"
mkdir -p /var/gestao-api/uploads /opt/gestao-api /var/log/gestao-api
chmod 755 /var/gestao-api /var/gestao-api/uploads

echo "Criado ${ENV_FILE}"
echo "Próximo: edite e preencha GOOGLE_*/APPLE_*/FIREBASE_* com valores da Vercel Production."
