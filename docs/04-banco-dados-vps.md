# 04 — Banco de dados na VPS

## Resumo

| Item | Valor |
|------|--------|
| **Host (na VPS)** | `127.0.0.1` |
| **Host (externo)** | `31.97.169.130` |
| **Porta** | `5433` |
| **Versão Postgres** | 16 |
| **Database** | `pibrr_gestao` |
| **Role** | `pibrr_gestao` |
| **Tamanho atual** | ~11 MB, 31 tabelas, 136 users |
| **Cutover produção** | 2026-08-29 (migrado do Neon) |

## Mapa de bancos na mesma VPS (não misturar)

| Database | Role | Consumidor | Tocar? |
|----------|------|------------|--------|
| **`pibrr_gestao`** | `pibrr_gestao` | gestao-api (futuro), hoje Vercel Next | **Sim** |
| `pibrr_vendas` | `pibrr_vendas` | vendas evolução | Não |
| `caixa_db` | `caixa_user` | caixa-api PDV | Não |
| `boreal_estofados` | `boreal` | outro produto | Não |

## Secrets na VPS

| Arquivo | Uso |
|---------|-----|
| `/root/.secrets/pibrr_gestao_database_url` | Conexão **local** (gestao-api em PM2) |
| `/root/.secrets/pibrr_gestao_database_url_external` | Conexão SSL externa (dev tunnel, Vercel legado) |

Formato local (exemplo — **senha real só na VPS**):

```text
postgresql://pibrr_gestao:***@127.0.0.1:5433/pibrr_gestao
```

Formato external:

```text
postgresql://pibrr_gestao:***@31.97.169.130:5433/pibrr_gestao?sslmode=require
```

### Configuração da gestao-api

Arquivo: `/opt/gestao-api/.env.production`

```bash
DATABASE_URL=postgresql://pibrr_gestao:SENHA@127.0.0.1:5433/pibrr_gestao
```

**Nunca** commitar senha. No deploy, `.env.production` é criado manualmente na VPS uma vez (ou via secret manager futuro).

## pg_hba.conf

Entradas existentes para `pibrr_gestao` (hostssl externo + local). A API em PM2 usa **localhost** — não precisa de SSL na conexão interna.

## Pool de conexões (gestao-api)

```typescript
import pg from 'pg'

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})
```

Diferente do Next na Vercel (serverless, 1 conexão por invocação).

## Schema existente (tabelas principais)

Migrado do Neon em 2026-08-29. Principais entidades:

| Grupo | Tabelas |
|-------|---------|
| Auth / users | `users`, `accounts`, `account_roles`, `roles`, `permissions`, … |
| Ministérios | `ministerios`, `ministerio_membros`, `ministerio_funcoes` |
| Eventos / escalas | `eventos`, `evento_modelos`, `evento_posicoes`, `escalas`, `escala_trocas` |
| Feed | `feed_posts`, `feed_likes`, `feed_comments` |
| Visitantes | `visitantes`, `visitante_mensagens_enviadas`, `mensagem_categorias`, `mensagem_modelos` |
| Membros | `user_indisponibilidades`, `user_gift_results`, `ministerio_form_respostas` |
| Push | `notifications`, `expo_push_tokens`, `push_subscriptions` |
| Sistema | `app_config`, `responsaveis`, `repertorio` |

Funções SQL importantes:

- `get_account_permissions(account_id, context_id)`
- `get_account_roles(account_id, context_type)`

## Migrations

### Estado atual

Schema criado via scripts em `pibrr/scripts/` e migrações SQL no app. **Não há Prisma** hoje.

### Estratégia gestao-api

1. Baseline: schema atual = migration `000_baseline.sql` (snapshot read-only, não reaplicar em prod)
2. Novas mudanças: `db/migrations/NNN_descricao.sql` + tabela `schema_migrations`
3. `deploy/post-deploy.sh` roda migrations antes do `pm2 reload`

### Comandos úteis na VPS

```bash
# Conectar
psql "$(cat /root/.secrets/pibrr_gestao_database_url)"

# Tamanho
psql "$URL" -c "SELECT pg_size_pretty(pg_database_size('pibrr_gestao'));"

# Contagens rápidas
psql "$URL" -c "SELECT count(*) FROM users; SELECT count(*) FROM accounts;"
```

## Backup

Cron existente: `/etc/cron.d/pibrr_gestao_backup`

- Diário 04:00 UTC
- Destino: `/var/backups/pibrr_gestao/`
- Retenção: 14 dias

Antes de migrations destrutivas em produção, `deploy/backup-pre-migrate.sh` gera dump extra.

## Rollback de dados

1. Restaurar dump em banco temporário ou sobrescrever `pibrr_gestao` (janela de manutenção)
2. Reverter deploy PM2 para imagem anterior
3. Neon mantido como backup read-only por 1–2 semanas pós-cutover (se ainda ativo)

## Desenvolvimento local

```bash
# Tunnel SSH
ssh -L 5433:127.0.0.1:5433 root@31.97.169.130

# .env local
DATABASE_URL=postgresql://pibrr_gestao:SENHA@127.0.0.1:5433/pibrr_gestao
```

Ou usar URL external com SSL (menos recomendado para dev diário).

## Upgrade Postgres 17 (opcional)

Neon era PG 17; VPS é PG 16. Cutover funcionou. Se precisar de features PG 17, planejar upgrade do cluster na VPS (fora do escopo imediato).
