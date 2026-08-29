# 01 — Visão e escopo

## Objetivo

Criar o **backend dedicado da gestão da igreja** (PIB Roraima), desacoplado do site institucional (`pibrr` na Vercel) e do app mobile (`pib-app`), centralizando:

- Autenticação (web + mobile)
- Autorização (roles legados + modelo `accounts` / permissões contextuais)
- Regras de negócio de domínio eclesiástico
- Acesso ao banco `pibrr_gestao` na VPS
- Jobs (push, notificações, backups auxiliares)

## Produtos no ecossistema

| Produto | Pasta | Consome gestao-api? |
|---------|-------|---------------------|
| Site institucional | `pibrr/` (landing) | Não (público; link feijoada) |
| Gestão web (admin) | `pibrr/` hoje → futuro `gestao-web/` | **Sim** |
| App membros | `pib-app/` | **Sim** |
| Vendas / feijoada | `vendas-pibrr/` | **Não** (API e DB próprios) |

## Princípios (decisões já tomadas)

1. **Não misturar** domínio igreja com domínio vendas/feijoada/PDV.
2. **Postgres na VPS** (`pibrr_gestao`) é a fonte da verdade — Neon descontinuado após cutover (2026-08-29).
3. **Auth:** Google/Apple (e opcionalmente Firebase) → API valida → **JWT próprio** + sessão web; **não** usar Firebase como diretório de usuários.
4. **Migração incremental** — sem big-bang; manter `pibrr` funcionando até cutover por módulo.
5. **API versionada** — prefixo `/v1/` desde o início.
6. **Pagamentos** (Mercado Pago, doações) ficam fora deste backend na fase 1; vendas tem API separada.

## Responsabilidades da gestao-api

### Dentro do escopo

| Área | Descrição |
|------|-----------|
| Auth | `POST /v1/auth/mobile`, sessão web, refresh, permissões |
| Users | Perfil, indisponibilidades, ministérios do membro |
| Accounts / RBAC | `accounts`, `account_roles`, `get_account_permissions` |
| Ministérios | CRUD, funções, membros, líderes |
| Eventos | CRUD, modelos, posições, repertório |
| Escalas | CRUD, minhas escalas, trocas, notificações de escala |
| Feed | Posts, likes, comentários |
| Visitantes | Acolhimento, mensagens, categorias, modelos |
| Dons espirituais | Questionário 76 itens, resultados |
| Notificações | In-app + registro push (Expo + web push) |
| Upload | Fotos de perfil, imagens de feed (Vercel Blob ou storage definido) |
| Config | `app_config`, feature flags operacionais |
| Contato | Formulário institucional (e-mail) |
| YouTube | Proxy/cache RSS (opcional) |

### Fora do escopo (fase 1)

| Área | Onde fica |
|------|-----------|
| PDV / caixa / tickets feijoada | `vendas-pibrr` + `caixa-api` |
| Landing pública / SEO | `pibrr` (Vercel) |
| Campanha feijoada online | `feijoada.pibrr.com` |
| Backend Nest monolítico “tudo em um” | Futuro opcional; não é fase 1 |
| Unificar DB vendas + gestão | Proibido sem decisão explícita |

## Estado atual (2026-08-29)

```text
pib-app ──► www.pibrr.com/api/* (Next Vercel)
                │
                └──► pibrr_gestao @ VPS :5433

Meta:
pib-app ──► gestao-api (VPS PM2) ──► pibrr_gestao @ localhost:5433
gestao-web ──► gestao-api
www.pibrr.com ──► só páginas públicas (+ link feijoada)
```

## Critérios de sucesso

- [ ] App mobile aponta para `gestao-api` sem regressão de login, escalas, feed, perfil
- [ ] Painel web admin opera via API (sem Route Handlers de domínio no Next)
- [ ] Vercel **não** conecta mais direto ao Postgres (só a API na VPS)
- [ ] Deploy automático em push `main` (GitHub Actions → VPS)
- [ ] Latência aceitável Brasil ↔ VPS (< 500 ms p95 em rotas críticas)
- [ ] Backup diário do banco mantido (cron existente)

## Glossário

| Termo | Significado |
|-------|-------------|
| `users` | Tabela legada de pessoa (nome, foto, role global) |
| `accounts` | Modelo novo de conta (journey_stage, permissões) |
| Role legado | `admin`, `supervisor`, `lider`, `membro`, `visitor` em `users.role` |
| Role contextual | Papel em ministério/evento via `account_roles` |
| JWT mobile | Token HS256 emitido pela API, 30 dias, Bearer |
