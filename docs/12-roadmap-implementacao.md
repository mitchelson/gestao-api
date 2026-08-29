# 12 — Roadmap de implementação

Cronograma sugerido em fases incrementais. Cada fase entrega valor testável em produção.

---

## Fase 0 — Fundação (semana 1) ✅ documentação

- [x] Repositório `gestao-api` com docs completas
- [x] Workflows CI/CD scaffold
- [ ] Bootstrap VPS: `/opt/gestao-api`, nginx, certbot, secrets
- [ ] Secrets GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

**Entregável:** repo no GitHub; VPS pronta para receber deploy.

---

## Fase 1 — MVP API (semana 2–3)

### Código

- [ ] Fastify 5 + TypeScript + `pg` pool
- [ ] `GET /health` (DB ping)
- [ ] `POST /v1/auth/mobile` (Google + Apple)
- [ ] Middleware JWT
- [ ] `GET /v1/users/me`
- [ ] `GET /v1/auth/permissions`
- [ ] Logger (pino), CORS, rate-limit auth

### Infra

- [ ] Primeiro deploy automático main → VPS
- [ ] `curl` health público OK

### Validação

- [ ] Login no app contra gestao-api (build dev)
- [ ] Paridade JSON com legado em `/users/me`

**Entregável:** app pode autenticar e ver perfil via nova API.

---

## Fase 2 — Core membro (semana 4–5)

- [ ] `GET /v1/escalas/minhas`
- [ ] `GET /v1/eventos` (filtros futuros)
- [ ] `GET/POST /v1/users/me/indisponibilidades`
- [ ] `GET /v1/users/me/pendencias`
- [ ] `GET/POST /v1/dons-espirituais`
- [ ] `GET /v1/notifications` + read-all
- [ ] `POST /v1/push/expo`

**Entregável:** abas Serviço e Perfil do app funcionam 100% na gestao-api.

### Cutover

- [ ] OTA production com `EXPO_PUBLIC_API_URL`

---

## Fase 3 — Líderes e admin (semana 6–8)

- [ ] Módulo escalas CRUD + trocas + notify
- [ ] Ministérios + funções
- [ ] Eventos + modelos + posições
- [ ] Visitantes + mensagens + responsáveis
- [ ] Feed (posts, likes, comments)
- [ ] Form ministérios + dons admin
- [ ] Upload + config + contato + youtube

**Entregável:** painel web pode migrar fetch para gestao-api.

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
- [ ] `gestao-api.pibrr.com` DNS + certbot

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
