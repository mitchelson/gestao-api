# 07 — Regras de negócio

Regras consolidadas das conversas anteriores e do código legado (`pibrr`). A gestao-api deve ser a **fonte única** dessas regras.

---

## Usuários e contas

### Cadastro e login

1. **Primeiro login** (Google/Apple/Firebase): cria `users` + `accounts` com role inicial `visitante` ou `membro` conforme fluxo signup.
2. **Conta existente** (mesmo email): vincula provider em `accounts` sem duplicar user.
3. **Merge de usuários**: se detectar duplicata (mesmo email, providers diferentes), `mergeUsers` preserva:
   - escalas (`escala_membros`)
   - dons (`user_gift_results`)
   - indisponibilidades (`user_indisponibilidades`)
   - ministérios (`user_ministerios`)
4. **Conta inativa** (`users.ativo = false`): login retorna 403; não emite JWT.
5. **`ensureAccountExists`**: toda autenticação mobile garante linha em `accounts` com `syncLegacyPrimaryRole`.

### Roles legados

| Role | Descrição |
|------|-----------|
| `visitor` | Visitante; acesso limitado no app |
| `membro` | Membro regular |
| `lider` | Líder de ministério |
| `supervisor` | Supervisiona múltiplos ministérios |
| `admin` | Acesso total |

### RBAC novo (transição)

- Tabelas: `accounts`, `account_roles`, `permissions`, `role_permissions`
- Functions SQL: `get_user_permissions`, `user_has_permission`
- Feature flags no legado controlam leitura/escrita do novo modelo
- gestao-api unifica em `AuthorizationService` (ver doc 05)

---

## Ministérios

1. Membro pode pertencer a **múltiplos ministérios** (`user_ministerios`).
2. Cada ministério tem **funções** (`ministerio_funcoes`) usadas nas escalas.
3. Líder só gerencia ministérios onde tem role `lider` ou `supervisor`.
4. Admin pode CRUD qualquer ministério.

---

## Eventos e escalas

### Eventos

1. Evento tem data, horário, ministério, tipo (culto, ensaio, etc.).
2. **Posições** do evento definem vagas por função.
3. **Modelos** permitem replicar estrutura de eventos recorrentes.

### Escalas

1. **`GET /escalas/minhas`**: retorna escalas do usuário logado (futuras e passadas conforme filtro).
2. **Serviço no app**: deve listar **eventos futuros** mesmo sem escala atribuída ao usuário (não depender só de `escala_membros`).
3. **Criação de escala**: líder+ do ministério do evento.
4. **Edição/exclusão**: autor da escala, líder do ministério ou admin.

### Trocas de escala

1. Membro solicita troca (`escala_trocas` status `pendente`).
2. Outro membro aceita ou líder aprova conforme regra configurada.
3. Notificação push/in-app ao solicitar e ao resolver.
4. **`GET /escalas/trocas`**: lista pendentes do usuário (como solicitante ou como possível substituto).

### Indisponibilidades

1. Membro registra períodos em que **não pode** servir.
2. Ao montar escala, sistema deve **alertar** (não bloquear obrigatoriamente) se membro indisponível.
3. Formato: `data_inicio`, `data_fim`, opcional `motivo`.

---

## Feed

1. Posts podem ser públicos ou restritos (conforme `visibilidade`).
2. Like e comentários exigem autenticação.
3. Autor ou admin pode deletar post.
4. Líderes podem postar em nome do ministério (se configurado).

---

## Visitantes e mensagens

1. **Visitantes**: cadastro por líderes; fluxo de acompanhamento pastoral.
2. **Mensagens**: categorias + modelos + histórico de enviadas.
3. **Responsáveis**: vínculo visitante ↔ membro responsável.
4. Status de mensagens pendentes exposto em `/visitantes/mensagens-status`.

---

## Formulários

### Formulário de ministérios

1. Membro preenche interesse em participar de ministérios.
2. Admin visualiza respostas agregadas.

### Dons espirituais

1. Questionário com resultados em `user_gift_results`.
2. **Pendente** só quando API confirma que não respondeu — **não** mostrar pendente em erro de API.
3. Admin vê relatório agregado.

---

## Notificações

1. In-app: tabela `notifications` com `lida`, `tipo`, `payload`.
2. Push Expo: tokens em `push_tokens` ou equivalente.
3. Marcar todas como lidas: `PUT /notifications/read-all`.
4. Escalas: endpoint `/escalas/notify` dispara push para membros escalados.

---

## Upload e mídia

1. Upload de imagens (avatar, feed) via `POST /upload`.
2. Armazenamento: definir em implementação (S3, local VPS, ou Vercel Blob legado).
3. URLs públicas retornadas ao client.

---

## Configuração global

1. `GET /config`: flags e textos do app (manutenção, versão mínima, etc.).
2. `PUT /config`: apenas admin.

---

## Contato e integrações

1. **`POST /contato`**: formulário público do site (rate-limit, sem auth).
2. **`GET /youtube`**: proxy/cache de vídeos do canal (API key server-side).

---

## Regras de autorização resumidas

```text
visitor     → feed leitura; sem serviço/admin
membro      → serviço, perfil, escalas próprias, trocas
lider       → + CRUD escalas do ministério, visitantes, mensagens
supervisor  → + múltiplos ministérios
admin       → tudo
```

---

## O que a gestao-api NÃO gerencia

| Domínio | Onde fica |
|---------|-----------|
| Vendas / feijoada / PDV | `vendas-pibrr` + `caixa-api` |
| Site institucional estático | `pibrr` páginas públicas |
| Pagamentos Mercado Pago | `vendas-pibrr` |

Não misturar bancos `pibrr_gestao` com `caixa_db` / `pibrr_vendas`.
