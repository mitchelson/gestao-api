# 06 — Módulos e API v1

Mapeamento completo das rotas atuais (`pibrr/app/api`) para **`gestao-api`** com prefixo `/v1`.

Legenda: 🌐 público | 🔒 autenticado | 👑 admin | 📋 líder/supervisor | 🎖️ admin ou líder do ministério

---

## Auth

| Legado | v1 | Método | Auth | Notas |
|--------|-----|--------|------|-------|
| `/api/auth/mobile` | `/v1/auth/mobile` | POST | 🌐 | Emite JWT |
| `/api/auth/permissions` | `/v1/auth/permissions` | GET | 🔒 | Permissões + roles |
| `/api/auth/set-mode` | `/v1/auth/set-mode` | POST | 🌐 | signup vs login (web) |
| `/api/auth/[...nextauth]` | — | * | — | Permanece no Next até fase web |
| — | `/v1/auth/health` | GET | 🌐 | Alias de health check auth |

---

## Users

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/users/me` | `/v1/users/me` | GET, PUT, DELETE | 🔒 |
| `/api/users/me/indisponibilidades` | `/v1/users/me/indisponibilidades` | GET, POST, DELETE | 🔒 |
| `/api/users/me/ministerios` | `/v1/users/me/ministerios` | GET, POST | 🔒 |
| `/api/users/me/pendencias` | `/v1/users/me/pendencias` | GET | 🔒 |
| `/api/users/ministerios` | `/v1/users/ministerios` | POST, DELETE | 📋 |
| `/api/users/[id]/profile` | `/v1/users/:id/profile` | GET | 🌐* |
| `/api/users` | `/v1/users` | GET, PUT | 👑 |

\* Perfil público de membros (sem dados sensíveis).

---

## Accounts (RBAC novo)

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/accounts/[id]/roles` | `/v1/accounts/:id/roles` | GET, POST, DELETE | 👑 |

---

## Ministérios

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/ministerios` | `/v1/ministerios` | GET, POST | GET 🌐/🔒; POST 👑 |
| `/api/ministerios/[id]` | `/v1/ministerios/:id` | GET, PUT, DELETE | 📋/👑 |
| `/api/ministerios/[id]/funcoes` | `/v1/ministerios/:id/funcoes` | GET, POST | 📋 |

---

## Eventos

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/eventos` | `/v1/eventos` | GET, POST | GET 🌐; POST 👑 |
| `/api/eventos/[id]` | `/v1/eventos/:id` | GET, PUT, DELETE | 👑 |
| `/api/eventos/[id]/posicoes` | `/v1/eventos/:id/posicoes` | GET, PUT | 📋 |
| `/api/eventos/modelos` | `/v1/eventos/modelos` | GET, POST | 👑 |
| `/api/eventos/modelos/[id]` | `/v1/eventos/modelos/:id` | GET, PUT, DELETE | 👑 |

---

## Escalas

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/escalas/minhas` | `/v1/escalas/minhas` | GET | 🔒 |
| `/api/escalas` | `/v1/escalas` | GET, POST | 🔒 / 📋 |
| `/api/escalas/[id]` | `/v1/escalas/:id` | PUT, DELETE | 🔒 / 📋 |
| `/api/escalas/trocas` | `/v1/escalas/trocas` | GET, POST | 🔒 |
| `/api/escalas/trocas/[id]` | `/v1/escalas/trocas/:id` | PUT | 🔒 |
| `/api/escalas/notify` | `/v1/escalas/notify` | POST | 📋 |

---

## Feed

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/feed` | `/v1/feed` | GET, POST | GET 🌐/🔒; POST 📋 |
| `/api/feed/[id]` | `/v1/feed/:id` | DELETE | 🔒 |
| `/api/feed/[id]/like` | `/v1/feed/:id/like` | POST, DELETE | 🔒 |
| `/api/feed/[id]/comments` | `/v1/feed/:id/comments` | GET, POST, DELETE | 🔒 |

---

## Visitantes e mensagens

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/visitantes` | `/v1/visitantes` | GET, POST | 📋 |
| `/api/visitantes/[id]` | `/v1/visitantes/:id` | GET, PUT, DELETE | 📋 |
| `/api/visitantes/mensagens-status` | `/v1/visitantes/mensagens-status` | GET | 📋 |
| `/api/mensagens/categorias` | `/v1/mensagens/categorias` | GET, POST | 📋 |
| `/api/mensagens/categorias/[id]` | `/v1/mensagens/categorias/:id` | PUT, DELETE | 📋 |
| `/api/mensagens/modelos` | `/v1/mensagens/modelos` | GET, POST | 📋 |
| `/api/mensagens/modelos/[id]` | `/v1/mensagens/modelos/:id` | PUT, DELETE | 📋 |
| `/api/mensagens/enviadas` | `/v1/mensagens/enviadas` | GET, POST | 📋 |
| `/api/responsaveis` | `/v1/responsaveis` | GET, POST | 👑 |
| `/api/responsaveis/[id]` | `/v1/responsaveis/:id` | PUT, DELETE | 👑 |

---

## Formulários

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/form-ministerios` | `/v1/form-ministerios` | GET, POST | 🔒 |
| `/api/form-ministerios/admin` | `/v1/form-ministerios/admin` | GET | 👑 |
| `/api/dons-espirituais` | `/v1/dons-espirituais` | GET, POST | 🔒 |
| `/api/dons-espirituais/admin` | `/v1/dons-espirituais/admin` | GET | 👑 |

---

## Notificações e push

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/notifications` | `/v1/notifications` | GET, PUT | 🔒 |
| `/api/notifications/read-all` | `/v1/notifications/read-all` | PUT | 🔒 |
| `/api/push/expo` | `/v1/push/expo` | POST | 🔒 |
| `/api/push/subscribe` | `/v1/push/subscribe` | POST | 🔒 |

---

## Outros

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/repertorio` | `/v1/repertorio` | GET, POST | 📋 |
| `/api/upload` | `/v1/upload` | POST | 🔒 |
| `/api/config` | `/v1/config` | GET, PUT | GET 🔒; PUT 👑 |
| `/api/contato` | `/v1/contato` | POST | 🌐 |
| `/api/youtube` | `/v1/youtube` | GET | 🌐 |
| `/api/visitor/restricted-action` | `/v1/visitor/restricted-action` | POST | 🔒 |

---

## Health

| Rota | Método | Auth | Resposta |
|------|--------|------|----------|
| `/health` | GET | 🌐 | `{ status: "ok", db: "ok", version: "1.0.0" }` |

---

## Compatibilidade temporária

A API aplica middleware que reescreve:

```text
/api/* → /v1/*
```

Assim o `pib-app` pode fazer OTA só com `EXPO_PUBLIC_API_URL=https://gestao-api.pibrr.com`, mantendo paths `/api/...` até uma versão futura migrar para `/v1`.

---

## Admin (app)

| Legado | v1 | Método | Auth |
|--------|-----|--------|------|
| `/api/admin/dashboard` (app; não existia no Next) | `/v1/admin/dashboard` | GET | 🔒 | `{ totalMembros }` |

---

## Referência detalhada

Contratos request/response completos: `pibrr/docs/API.md` (atualizar base URL após cutover).

Total: **54 route files** no Next → **~45 recursos v1** (alguns consolidados) + admin/dashboard.