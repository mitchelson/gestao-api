# 11 — Migração desde `pibrr`

Plano para extrair a API do monólito Next.js (`pibrr`) para `gestao-api` na VPS **sem downtime prolongado**.

---

## Estado atual (pós-migração Neon → VPS)

| Componente | Onde roda | Banco |
|------------|-----------|-------|
| Site + API Next | Vercel (`www.pibrr.com`) | `pibrr_gestao` @ VPS via `DATABASE_URL` |
| App mobile | Expo | API em `www.pibrr.com/api/*` |
| Auth mobile | `POST /api/auth/mobile` | JWT 30d |
| Auth web | NextAuth cookies | mesmo DB |

A gestao-api **reutiliza o mesmo banco** `pibrr_gestao` — não há migração de schema obrigatória na v1 (apenas portar queries).

---

## Estratégia: strangler fig

```text
Fase 0 ─ Documentação + scaffold (este repo)
Fase 1 ─ gestao-api na VPS com /health + /v1/auth/mobile + /v1/users/me
Fase 2 ─ App aponta EXPO_PUBLIC_API_URL para gestao-api (OTA)
Fase 3 ─ Demais rotas módulo a módulo
Fase 4 ─ Web admin chama gestao-api (BFF ou direto)
Fase 5 ─ Remover rotas /api/* do pibrr (exceto NextAuth se necessário)
```

---

## Mapeamento de código fonte

| gestao-api (novo) | Origem em `pibrr` |
|-------------------|-------------------|
| `src/modules/auth/auth.controller.ts` | `app/api/auth/mobile/route.ts` |
| `src/common/guards/jwt-auth.guard.ts` | `lib/mobile-auth.ts` |
| `src/modules/auth/auth.service.ts` | `lib/mobile-auth-user.ts` |
| `src/lib/account-roles.ts` | `lib/account-roles.ts` |
| `src/modules/users/*` | `app/api/users/**` |
| `src/modules/escalas/*` | `app/api/escalas/**` |
| ... | ver doc 06 |

### O que NÃO portar para gestao-api

- Páginas React / App Router
- `middleware.ts` Edge do Next
- `lib/neon.ts` dual driver — usar `pg` pool direto
- Rotas de vendas / feijoada

---

## Compatibilidade de contratos

1. **Paths:** manter mesmo body/response que `pibrr/docs/API.md`
2. **Prefixo:** adicionar `/v1` ou rewrite nginx `/api` → `/v1`
3. **JWT:** mesmo secret durante transição
4. **Status codes:** idênticos (401, 403, 404, 422)

### Testes de paridade

Para cada rota migrada:

```bash
# Legado
curl -H "Authorization: Bearer $TOKEN" https://www.pibrr.com/api/users/me

# Novo
curl -H "Authorization: Bearer $TOKEN" https://gestao-api.pibrr.com/v1/users/me

# diff JSON (ignorar campos de timestamp se necessário)
```

---

## Cutover do app mobile

1. Publicar gestao-api com auth + users/me estáveis
2. Build OTA `pib-app` com `EXPO_PUBLIC_API_URL=https://gestao-api.pibrr.com`
3. Monitorar Sentry / logs 48h
4. Se OK, migrar próximo módulo (escalas)

Rollback: reverter `EXPO_PUBLIC_API_URL` para `https://www.pibrr.com` via OTA.

---

## Cutover do site web

Opções:

| Opção | Prós | Contras |
|-------|------|---------|
| A) BFF no Next | Menos mudança no frontend | Next ainda no caminho |
| B) Fetch direto do browser | Next só estático | CORS, cookies |
| C) NextAuth + API separada | Auth web isolada | Dois sistemas de sessão |

**Recomendação:** Opção A na fase 4 — `lib/api.ts` do `pibrr` aponta para `GESTAO_API_URL` server-side.

---

## Banco de dados

- **Sem fork de schema** na v1
- Migrations futuras em `gestao-api/migrations/` (SQL numerado)
- Coordenar com backup cron existente antes de DDL

### Migrations pendentes (se houver)

Listar diferenças entre schema Neon dump e produção antes de qualquer ALTER.

---

## DNS e SSL

1. Criar registro `gestao-api.pibrr.com` → `31.97.169.130`
2. `certbot --nginx -d gestao-api.pibrr.com`

---

## Limpeza pós-migração

| Item | Ação |
|------|------|
| `pibrr/app/api/*` | Remover módulos migrados |
| `lib/neon.ts` no pibrr | Manter só se Next ainda ler DB (fase 4) |
| Env Neon na Vercel | Remover quando estável |
| `DATABASE_URL` na Vercel | Remover quando Next não acessar DB |
| Docs `pibrr/docs/API.md` | Atualizar base URL |

---

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| JWT secret diferente | Copiar secret da Vercel para VPS |
| Latência app → VPS API | CDN não aplicável; VPS já serve DB |
| Regressão de permissões | Testes de paridade por role |
| Deploy quebrado | Health check no post-deploy; rollback PM2 |

---

## Critérios de "migração completa"

- [ ] 100% rotas doc 06 em gestao-api
- [ ] App e web usam gestao-api em produção
- [ ] Zero tráfego em `www.pibrr.com/api/*` (métricas nginx/Vercel)
- [ ] `pibrr` sem dependência `postgres` / `DATABASE_URL` (opcional)
