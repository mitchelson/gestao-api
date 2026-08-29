# 08 — Infraestrutura VPS

## Servidor

| Item | Valor |
|------|--------|
| Host | `31.97.169.130` |
| OS | Ubuntu (Hostinger VPS) |
| Acesso SSH | chave deploy (GitHub Actions) + acesso manual root |
| Reverse proxy | nginx |
| Process manager | PM2 |

## Posicionamento na VPS

```text
Internet
    │
    ▼
nginx (443) ──► gestao-api.pibrr.com       → 127.0.0.1:3060
              ──► caixa-api (3050)
              ──► school-backend (outra porta)
              ──► outros serviços
    │
    ▼
PostgreSQL 16 (Docker) :5433
    └── database: pibrr_gestao
```

## Diretórios

| Path | Uso |
|------|-----|
| `/opt/gestao-api` | Código deployado (dist + package.json + ecosystem) |
| `/root/.secrets/pibrr_gestao_database_url` | `DATABASE_URL` local (`127.0.0.1:5433`) |
| `/root/.secrets/gestao_api_env` | Demais env vars (JWT, Google, etc.) |
| `/var/log/gestao-api/` | Logs PM2 (opcional, symlink) |

## Porta

| Serviço | Porta interna |
|---------|----------------|
| gestao-api | **3060** |
| caixa-api | 3050 |
| Postgres | 5433 (host → container) |

## Banco de dados

- **Database:** `pibrr_gestao`
- **Conexão da API (produção):** sempre `127.0.0.1:5433` na VPS (não expor Postgres à internet)
- **Conexão externa (dev/migração):** via túnel SSH ou secret `_external` com SSL

```bash
# Na VPS — leitura do secret (exemplo)
source /root/.secrets/pibrr_gestao_database_url
# postgresql://gestao_api:***@127.0.0.1:5433/pibrr_gestao
```

### Role dedicada (recomendado)

Criar role `gestao_api` com permissões mínimas em `pibrr_gestao` (não usar superuser em runtime).

```sql
CREATE ROLE gestao_api WITH LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE pibrr_gestao TO gestao_api;
GRANT USAGE ON SCHEMA public TO gestao_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gestao_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gestao_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gestao_api;
```

## Nginx (exemplo)

```nginx
server {
    listen 443 ssl http2;
    server_name gestao-api.pibrr.com;

    ssl_certificate     /etc/letsencrypt/live/gestao-api.pibrr.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gestao-api.pibrr.com/privkey.pem;

    location /uploads/ {
        alias /var/gestao-api/uploads/;
        access_log off;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:3060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }
}
```

## PM2

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'gestao-api',
    script: 'dist/main.js',
    cwd: '/opt/gestao-api',
    instances: 1,
    exec_mode: 'fork',
    env_file: '/root/.secrets/gestao_api_env',
    max_memory_restart: '512M',
  }],
};
```

Comandos:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # se ainda não configurado
```

## Backup

- Cron existente: `/etc/cron.d/pibrr_gestao_backup` (04:00 UTC, retenção 14 dias)
- gestao-api **não** substitui backup; apenas consome o mesmo DB

## Firewall

- Postgres **não** exposto publicamente (só localhost + rede Docker)
- API exposta via nginx 443 apenas
- SSH restrito a chaves

## Monitoramento (fase 2)

- Health check: `GET /health` para uptime (UptimeRobot, etc.)
- Logs: PM2 + opcional Sentry
- Métricas: opcional Prometheus node_exporter

## Comparação com outros projetos na VPS

| Projeto | Path | Porta | Deploy |
|---------|------|-------|--------|
| caixa-api | `/var/www/caixa-api` | 3050 | manual |
| school-backend | `/opt/school-backend` | variável | GitHub Actions |
| **gestao-api** | `/opt/gestao-api` | **3060** | **GitHub Actions** |

Padrão de deploy alinhado a **school-backend** (ver doc 09).
