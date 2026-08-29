# 05 — Autenticação e permissões

## Modelo geral

```text
IdP externo (Google / Apple / Firebase*)
        ↓ idToken validado no servidor
gestao-api resolve/cria user em Postgres
        ↓
Emite JWT (mobile) ou cookie de sessão (web)
        ↓
Clientes enviam credencial em cada request
        ↓
Middleware valida JWT/cookie — NÃO consulta DB por request (hot path)
```

\* Firebase: apenas como **provider opcional** de login; **não** é diretório de usuários.

## Mobile — JWT Bearer

### Emissão: `POST /v1/auth/mobile`

Portar lógica de `pibrr/app/api/auth/mobile/route.ts` + `lib/mobile-auth-user.ts`.

**Body Google:**

```json
{ "provider": "google", "idToken": "<token>" }
```

**Body Apple:**

```json
{
  "provider": "apple",
  "identityToken": "<token>",
  "email": "opcional@email.com",
  "fullName": { "givenName": "...", "familyName": "..." }
}
```

**Body Firebase (opcional):**

```json
{ "provider": "firebase", "idToken": "<firebase-id-token>" }
```

**Resposta 200:**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Nome",
    "email": "email@exemplo.com",
    "image": "https://...",
    "role": "membro",
    "ministerioIds": ["uuid"]
  }
}
```

### JWT

| Campo | Valor |
|-------|--------|
| Algoritmo | HS256 |
| Secret | `AUTH_JWT_SECRET` (ou `AUTH_MOBILE_SECRET` legado) |
| Expiração | 30 dias |
| Payload | `userId`, `role`, `ministerioIds`, `sub` |

```json
{
  "userId": "uuid",
  "role": "admin | supervisor | lider | membro | visitor",
  "ministerioIds": ["uuid"],
  "sub": "uuid",
  "iat": 0,
  "exp": 0
}
```

### Validação (middleware)

1. Header `Authorization: Bearer <token>`
2. `jwtVerify` com secret
3. Extrair `userId = payload.userId ?? payload.sub`
4. Extrair `role = payload.role ?? "membro"`
5. **Não** consultar `users.ativo` em cada request (checagem no login + job opcional de revogação)
6. Anexar `request.user = { userId, role, ministerioIds }`

### Erros

| Status | Quando |
|--------|--------|
| 401 | Token ausente, expirado ou inválido |
| 403 | Conta bloqueada (`ativo = false`) no login |
| 404 | User não encontrado após login |

## Web — sessão (fases)

### Fase 1 — compatibilidade

`pibrr` na Vercel continua com NextAuth; app usa JWT da gestao-api.

### Fase 2 — API como emissor

Endpoints planejados:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/auth/google` | Inicia OAuth |
| GET | `/v1/auth/google/callback` | Callback, set cookie |
| POST | `/v1/auth/logout` | Limpa cookie |
| GET | `/v1/auth/session` | Sessão atual (web) |

Cookie: `httpOnly`, `secure`, `sameSite=lax`, domínio `.pibrr.com`.

### Fase 2 alternativa — BFF NextAuth

NextAuth no `gestao-web` chama `POST /v1/auth/mobile` ou endpoint interno de troca — menos mudança no browser.

## Permissões

### Modelo dual (transição)

| Sistema | Uso |
|---------|-----|
| **Legado** | `users.role` — admin, supervisor, lider, membro, visitor |
| **Novo** | `accounts` + `account_roles` + `permissions` via SQL functions |

Feature flags no legado (`pibrr`):

- `FEATURE_FLAG_USE_NEW_PERMISSIONS`
- `FEATURE_FLAG_USE_NEW_PERMISSIONS_READ`

gestao-api deve **unificar** em um serviço `AuthorizationService`:

```typescript
async getEffectivePermissions(userId: string): Promise<Permission[]>
async hasPermission(userId: string, name: string, contextId?: string): Promise<boolean>
async hasRole(userId: string, role: string): Promise<boolean>
```

### Endpoint: `GET /v1/auth/permissions`

Portar `pibrr/app/api/auth/permissions/route.ts`.

**Auth:** Bearer JWT

**Resposta:**

```json
{
  "permissions": [{ "name": "escalas:create", "display_name": "...", "category": "..." }],
  "roles": [{ "role_name": "lider", "role_display_name": "...", "context_type": "ministry", "context_name": "..." }],
  "journey_stage": "membro"
}
```

### Matriz de roles legados (app)

| Role | Feed | Serviço | Admin tab | Escalas admin |
|------|------|---------|-----------|---------------|
| `visitor` | leitura | bloqueado | não | não |
| `membro` | sim | sim | não | não |
| `lider` | sim | sim | parcial | seu ministério |
| `supervisor` | sim | sim | parcial | ministérios |
| `admin` | sim | sim | sim | tudo |

### Regras de autorização por rota

| Padrão | Quem |
|--------|------|
| `requireAuth()` | Qualquer JWT válido |
| `requireAdmin()` | `role === admin` |
| `requireLiderOrAdmin()` | admin, supervisor, lider |
| `requireMinisterioAccess(ministerioId)` | admin OU líder/supervisor daquele ministério |
| `requirePermission('escalas:create')` | novo modelo |

## Contas e `ensureAccountExists`

Portar `lib/account-roles.ts`:

- Todo user com login mobile deve ter linha em `accounts`
- `syncLegacyPrimaryRole` mantém paridade `users.role` ↔ `account_roles`
- Login Apple/Google cria `visitante` se primeiro acesso (signup)

## Segurança

| Risco | Mitigação |
|-------|-----------|
| Brute force em auth | rate-limit 10 req/min por IP em `/v1/auth/*` |
| JWT roubado | HTTPS only; expiração 30d; logout = client discard (fase 2: denylist) |
| Conta desativada | Checar `ativo` no **login**, não a cada request |
| Merge de contas duplicadas | `mergeUsers` em `mobile-auth-user` — preservar escalas, dons, indisponibilidades |

## Variáveis relacionadas

Ver [10-variaveis-ambiente.md](./10-variaveis-ambiente.md):

- `AUTH_JWT_SECRET`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (web)
- `GOOGLE_CLIENT_IDS` (validação mobile — iOS, Android, Web)
- `APPLE_CLIENT_ID`
- `FIREBASE_PROJECT_ID` / `FIREBASE_SERVICE_ACCOUNT_JSON`

## O que NÃO fazer

- Migrar todo login para Firebase Auth como produto
- Usar Neon HTTP driver
- Validar JWT consultando Postgres em cada request (latência + logout em massa)
- Compartilhar JWT secret com `vendas-pibrr`
