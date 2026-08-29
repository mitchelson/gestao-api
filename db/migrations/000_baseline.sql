-- =============================================================================
-- READ-ONLY BASELINE SCHEMA REFERENCE
-- Consolidated from /tmp/pibrr/scripts/ (001-create-tables.sql + key migrations)
-- DO NOT run in production — use incremental migrations instead.
-- This file documents the expected schema state for the NestJS API port.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Core: responsaveis & visitantes (001-create-tables.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  celular TEXT NOT NULL,
  sexo TEXT,
  cidade TEXT,
  cidade_outra TEXT,
  bairro TEXT,
  faixa_etaria TEXT,
  civil_status TEXT,
  telefone TEXT,
  membro_igreja BOOLEAN DEFAULT FALSE,
  quer_visita BOOLEAN DEFAULT FALSE,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mensagem_enviada BOOLEAN DEFAULT FALSE,
  sem_whatsapp BOOLEAN DEFAULT FALSE,
  responsavel_id UUID REFERENCES responsaveis(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_visitantes_data_cadastro ON visitantes(data_cadastro DESC);
CREATE INDEX IF NOT EXISTS idx_visitantes_responsavel_id ON visitantes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_nome ON responsaveis(nome);

-- ---------------------------------------------------------------------------
-- Core: users, ministerios, eventos, escalas (008-migracao-completa.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  foto_url TEXT,
  telefone TEXT,
  role TEXT NOT NULL DEFAULT 'membro',
  permite_escala_multipla BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_login_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS ministerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT DEFAULT '#D4C5B0',
  icone TEXT DEFAULT '⛪',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ministerio_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_lider BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ministerio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_min_mem_ministerio ON ministerio_membros(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_min_mem_user ON ministerio_membros(user_id);

CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  horario TIME,
  descricao TEXT,
  tipo TEXT DEFAULT 'Culto',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data DESC);

CREATE TABLE IF NOT EXISTS escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  funcao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evento_id, user_id, ministerio_id)
);

CREATE INDEX IF NOT EXISTS idx_escalas_evento ON escalas(evento_id);
CREATE INDEX IF NOT EXISTS idx_escalas_user ON escalas(user_id);
CREATE INDEX IF NOT EXISTS idx_escalas_ministerio ON escalas(ministerio_id);

-- ---------------------------------------------------------------------------
-- Visitantes FK to users (008-migracao-completa + 011-visitante-responsavel-user)
-- ---------------------------------------------------------------------------

ALTER TABLE visitantes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visitantes_user_id ON visitantes(user_id);

-- ---------------------------------------------------------------------------
-- Responsaveis user_id (010-responsavel-user-id.sql)
-- ---------------------------------------------------------------------------

ALTER TABLE responsaveis ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_responsaveis_user ON responsaveis(user_id);

-- ---------------------------------------------------------------------------
-- Mensagens (003-mensagens-tables.js + 005-rename-conteudo.js)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mensagem_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  dia TEXT NOT NULL,
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mensagem_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES mensagem_categorias(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visitante_mensagens_enviadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitante_id UUID NOT NULL REFERENCES visitantes(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES mensagem_categorias(id) ON DELETE CASCADE,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(visitante_id, categoria_id)
);

-- ---------------------------------------------------------------------------
-- Feed (011-feed-posts.js)
-- ---------------------------------------------------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nascimento DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_batismo DATE;

CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo TEXT,
  imagem_url TEXT,
  link TEXT,
  fixado BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS mencoes_ministerios JSONB;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS mencoes_users JSONB;

CREATE INDEX IF NOT EXISTS idx_feed_posts_criado ON feed_posts(criado_em DESC);

CREATE TABLE IF NOT EXISTS feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON feed_likes(post_id);

CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id);

-- ---------------------------------------------------------------------------
-- Notifications & indisponibilidades (012-indisponibilidades-notifications.js)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_indisponibilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  motivo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indisponibilidades_user ON user_indisponibilidades(user_id);
CREATE INDEX IF NOT EXISTS idx_indisponibilidades_datas ON user_indisponibilidades(data_inicio, data_fim);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  link TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, lida, criado_em DESC);

-- ---------------------------------------------------------------------------
-- Push subscriptions (009-push-subscriptions.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id);

-- ---------------------------------------------------------------------------
-- Expo push tokens (015-expo-push-tokens.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user ON expo_push_tokens(user_id);

-- ---------------------------------------------------------------------------
-- App config (010-app-config.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Dons espirituais (014-dons-espirituais.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_gift_results (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ---------------------------------------------------------------------------
-- Ministerio funcoes (008-ministerio-funcoes.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ministerio_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ministerio_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_min_funcoes_ministerio ON ministerio_funcoes(ministerio_id);

-- ---------------------------------------------------------------------------
-- Evento modelos & posicoes (010-evento-modelos-posicoes.sql)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS evento_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT DEFAULT 'Culto',
  horario TIME,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evento_posicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  modelo_id UUID REFERENCES evento_modelos(id) ON DELETE CASCADE,
  ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  funcao TEXT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (evento_id IS NOT NULL OR modelo_id IS NOT NULL)
);

ALTER TABLE eventos ADD COLUMN IF NOT EXISTS modelo_id UUID REFERENCES evento_modelos(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS observacoes TEXT;

CREATE INDEX IF NOT EXISTS idx_evento_posicoes_evento ON evento_posicoes(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_posicoes_modelo ON evento_posicoes(modelo_id);
CREATE INDEX IF NOT EXISTS idx_evento_posicoes_ministerio ON evento_posicoes(ministerio_id);

-- ---------------------------------------------------------------------------
-- Escala trocas (013-escala-trocas.js)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS escala_trocas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  escala_solicitante_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  escala_destinatario_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escala_trocas_dest ON escala_trocas(destinatario_id, status);
CREATE INDEX IF NOT EXISTS idx_escala_trocas_solic ON escala_trocas(solicitante_id, status);

-- ---------------------------------------------------------------------------
-- Repertorio (013-repertorio.sql)
-- ---------------------------------------------------------------------------

ALTER TABLE eventos ADD COLUMN IF NOT EXISTS repertorio_ministerio_id UUID REFERENCES ministerios(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS repertorio_funcao TEXT;

CREATE TABLE IF NOT EXISTS repertorio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tonalidade TEXT,
  link TEXT,
  observacoes TEXT,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repertorio_evento ON repertorio_items(evento_id);

-- ---------------------------------------------------------------------------
-- Ministerio membros pendente (migration.sql)
-- ---------------------------------------------------------------------------

ALTER TABLE ministerio_membros ADD COLUMN IF NOT EXISTS pendente BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Form ministerios (form-ministerios routes)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ministerio_form_respostas (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ministerios JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ministerios ADD COLUMN IF NOT EXISTS form_obrigatorio BOOLEAN DEFAULT false;

-- ---------------------------------------------------------------------------
-- Apple & Firebase auth (016-apple-id-visitor.sql, 017-firebase-uid.sql)
-- ---------------------------------------------------------------------------

ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id) WHERE apple_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(trim(email))) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid) WHERE firebase_uid IS NOT NULL;
