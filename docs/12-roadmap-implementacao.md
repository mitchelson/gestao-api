# 12 — Roadmap de implementação

Cronograma sugerido em fases incrementais. Cada fase entrega valor testável em produção.

---

## Fase 0 — Fundação (semana 1) ✅

- [x] Repositório `gestao-api` com docs completas
- [x] Workflows CI/CD scaffold
- [x] Bootstrap VPS: `/opt/gestao-api`, nginx, certbot, secrets base
- [x] Secrets GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` / `VPS_PASSWORD` (ver [13-go-live-checklist.md](./13-go-live-checklist.md))

**Entregável:** repo no GitHub; VPS com API no ar.

---

## Fase 1 — MVP API (semana 2–3) ✅ código + deploy

### Código

- [x] NestJS 11 + TypeScript + `pg` pool
- [x] `GET /health` (DB ping)
- [x] `POST /v1/auth/mobile` (Google + Apple)
- [x] `JwtAuthGuard` (validação JWT)
- [x] `GET /v1/users/me`
- [x] `GET /v1/auth/permissions`
- [x] Logger (NestJS), CORS (`@nestjs/config`), rate-limit (`@nestjs/throttler`)

### Infra

- [x] Deploy na VPS (manual bootstrap; CI aguarda secrets GitHub)
- [x] `curl https://gestao-api.pibrr.com/health` → 200

### Validação

- [x] Preencher Google/Apple/Firebase em `/root/.secrets/gestao_api_env`
- [ ] Login de teste contra gestao-api (sem cutover do app)
- [ ] Paridade JSON com legado em `/users/me`
- [x] Compat `/api`→`/v1` + `GET /v1/admin/dashboard` (pré-OTA)

**Entregável:** API autenticável; app ainda no legado até cutover.

---

## Fase 2 — Core membro (semana 4–5) ✅ código

- [x] `GET /v1/escalas/minhas`
- [x] `GET /v1/eventos` (filtros futuros)
- [x] `GET/POST /v1/users/me/indisponibilidades`
- [x] `GET /v1/users/me/pendencias`
- [x] `GET/POST /v1/dons-espirituais`
- [x] `GET /v1/notifications` + read-all
- [x] `POST /v1/push/expo`

**Entregável:** código pronto; cutover OTA **pendente** (decisão explícita).

### Cutover

- [ ] OTA production com `EXPO_PUBLIC_API_URL=https://gestao-api.pibrr.com`

---

## Fase 3 — Líderes e admin (semana 6–8) ✅ código

- [x] Módulo escalas CRUD + trocas + notify
- [x] Ministérios + funções
- [x] Eventos + modelos + posições
- [x] Visitantes + mensagens + responsáveis
- [x] Feed (posts, likes, comments)
- [x] Form ministérios + dons admin
- [x] Upload + config + contato + youtube

**Entregável:** código pronto; painel web ainda no Next até Fase 4.

---

## Fase 4 — Web e auth unificada (semana 9–10)

- [ ] `pibrr/lib/api.ts` → `GESTAO_API_URL`
- [ ] NextAuth BFF ou OAuth na gestao-api
- [ ] CORS e cookies `.pibrr.com`
- [ ] Remover rotas `/api/*` duplicadas do Next

**Entregável:** um único backend para web + mobile.

---

## Fase 5 — Hardening (semana 11+)

- [ ] Testes integração (supertest + DB test)
- [ ] Sentry na API
- [ ] Role `gestao_api` least privilege
- [ ] Denylist JWT logout (opcional)
- [ ] Staging branch (opcional)
- [ ] `gestao-api.pibrr.com` DNS + certbot ✅ (2026-08-29)

---

## Priorização de módulos (após Fase 1)

| Ordem | Módulo | Motivo |
|-------|--------|--------|
| 1 | Auth + users/me | Desbloqueia app |
| 2 | Escalas + eventos | Dor principal app |
| 3 | Notificações + push | Engajamento |
| 4 | Indisponibilidades + dons | Perfil |
| 5 | Feed | Público + social |
| 6 | Visitantes/mensagens | Líderes |
| 7 | Admin (users, config) | Web gestão |

---

## Definição de pronto (DoD) por rota

- [ ] Handler implementado com mesma assinatura do legado
- [ ] Auth/autorização conforme doc 05–07
- [ ] Teste manual documentado no PR
- [ ] Sem query N+1 evidente
- [ ] Erros com mensagens em português (quando aplicável)
- [ ] Log estruturado em erros 5xx

---

## Equipe e agentes

| Área | Responsável |
|------|-------------|
| Implementação API | agente backend / dev |
| Deploy VPS | ops (este doc + school-backend ref) |
| App cutover | `pib-app` OTA |
| Web cutover | `pibrr` frontend |
| Produto/regras | `docs/07-vendas-fluxos` **não** — usar doc 07 deste repo |

---

## Métricas de sucesso

| Métrica | Meta |
|---------|------|
| Latência p95 `/users/me` | < 300ms na VPS |
| Uptime `/health` | 99.5% |
| Erros 5xx | < 0.1% requests |
| App crash pós-cutover | zero relacionado a API |

---

## Referências

- [01-visao-e-escopo.md](./01-visao-e-escopo.md)
- [02-system-design.md](./02-system-design.md)
- [06-modulos-e-api-v1.md](./06-modulos-e-api-v1.md)
- [09-deploy-github-actions.md](./09-deploy-github-actions.md)
- Workspace: `docs/03-arquitetura-alvo.md`, `docs/15-migracao-neon-vps-gestao.md`
