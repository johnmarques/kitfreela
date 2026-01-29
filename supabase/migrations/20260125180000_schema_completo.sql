-- ============================================================
-- KITFREELA - SCHEMA COMPLETO DO BANCO DE DADOS
-- ============================================================
-- Projeto: PRD_KITFREELA
-- Supabase Project ID: kprgoxojtzexuclwhotp
-- Data: 2026-01-25
-- ============================================================

-- Nota: Usando gen_random_uuid() nativo do PostgreSQL 13+
-- Não requer extensões adicionais

-- ============================================================
-- 1. TIPOS ENUMERADOS (ENUMs)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE person_type AS ENUM ('pf', 'pj');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('rascunho', 'enviada', 'aceita', 'encerrada', 'expirada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('rascunho', 'ativo', 'finalizado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'pro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'blocked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE validity_unit AS ENUM ('dias', 'semanas', 'meses');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE date_format AS ENUM ('dd/mm/aaaa', 'mm/dd/aaaa', 'aaaa-mm-dd');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE prazo_modo AS ENUM ('days', 'date');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. TABELA FREELANCERS (Principal)
-- ============================================================

CREATE TABLE IF NOT EXISTS freelancers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dados pessoais
  nome VARCHAR(255),
  email VARCHAR(255),
  person_type person_type DEFAULT 'pf',
  cpf VARCHAR(14),
  cnpj VARCHAR(18),

  -- Localização
  city VARCHAR(100),
  state VARCHAR(2),

  -- Contato
  whatsapp VARCHAR(20),
  professional_email VARCHAR(255),

  -- Configurações
  default_signature TEXT,
  plan VARCHAR(20) DEFAULT 'free',
  default_proposal_validity INT DEFAULT 15,
  validity_unit VARCHAR(20) DEFAULT 'dias',
  date_format VARCHAR(20) DEFAULT 'dd/mm/aaaa',
  auto_save_drafts BOOLEAN DEFAULT TRUE,

  -- Notificações
  notif_email BOOLEAN DEFAULT TRUE,
  notif_followup BOOLEAN DEFAULT TRUE,
  notif_expiring_proposals BOOLEAN DEFAULT TRUE,
  notif_pending_payments BOOLEAN DEFAULT TRUE,

  -- Stripe Integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  plan_type plan_type DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'trial',
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_freelancers_user_id ON freelancers(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancers_email ON freelancers(email);
CREATE INDEX IF NOT EXISTS idx_freelancers_stripe_customer_id ON freelancers(stripe_customer_id);

-- ============================================================
-- 3. TABELA CLIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,

  -- Dados básicos
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),

  -- Tipo de pessoa
  tipo_pessoa person_type DEFAULT 'pf',
  cpf VARCHAR(14),
  cnpj VARCHAR(18),
  rg VARCHAR(20),
  razao_social VARCHAR(255),

  -- Endereço
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),

  -- Outros
  observacoes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_freelancer_id ON clientes(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

-- ============================================================
-- 4. TABELA PROPOSTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Dados do cliente (snapshot)
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255),
  cliente_telefone VARCHAR(20),

  -- Dados do serviço
  servico VARCHAR(255) NOT NULL,
  escopo TEXT,
  prazo VARCHAR(100),
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0,
  forma_pagamento VARCHAR(100),

  -- Status e follow-up
  status proposal_status DEFAULT 'rascunho',
  followup_data DATE,
  followup_canal VARCHAR(50),
  observacoes TEXT,

  -- Validade
  validade_dias INT DEFAULT 15,
  data_expiracao DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_propostas_freelancer_id ON propostas(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_propostas_cliente_id ON propostas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_created_at ON propostas(created_at DESC);

-- ============================================================
-- 5. TABELA CONTRATOS
-- ============================================================

CREATE TABLE IF NOT EXISTS contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Dados do cliente (snapshot)
  tipo_pessoa person_type DEFAULT 'pf',
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_documento VARCHAR(20),
  cliente_rg VARCHAR(20),
  cliente_razao_social VARCHAR(255),
  cliente_endereco TEXT,
  cliente_cidade VARCHAR(100),
  cliente_estado VARCHAR(2),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),

  -- Dados do serviço
  servico_nome VARCHAR(255) NOT NULL,
  servico_escopo TEXT,
  entregas TEXT,
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Prazo
  prazo_modo prazo_modo DEFAULT 'days',
  prazo_dias INT,
  prazo_tipo VARCHAR(50),
  prazo_data DATE,

  -- Pagamento
  pagamento_tipo VARCHAR(50) DEFAULT 'unico',
  pagamento_parcelas JSONB,
  pagamento_observacoes TEXT,

  -- Status e conteúdo
  status contract_status DEFAULT 'rascunho',
  texto_contrato TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contratos_freelancer_id ON contratos(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_contratos_proposta_id ON contratos(proposta_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_contratos_created_at ON contratos(created_at DESC);

-- ============================================================
-- 6. TABELA REGISTROS FINANCEIROS
-- ============================================================

CREATE TABLE IF NOT EXISTS registros_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,

  -- Dados do registro
  descricao VARCHAR(255) NOT NULL,
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Datas
  data_vencimento DATE,
  data_recebimento DATE,

  -- Status
  recebido BOOLEAN DEFAULT FALSE,
  forma_pagamento VARCHAR(50),
  observacoes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_financeiros_freelancer_id ON registros_financeiros(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_registros_financeiros_contrato_id ON registros_financeiros(contrato_id);
CREATE INDEX IF NOT EXISTS idx_registros_financeiros_recebido ON registros_financeiros(recebido);
CREATE INDEX IF NOT EXISTS idx_registros_financeiros_data_vencimento ON registros_financeiros(data_vencimento);

-- ============================================================
-- 7. TABELA PERFIS PÚBLICOS
-- ============================================================

CREATE TABLE IF NOT EXISTS perfis_publicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,

  -- Dados do perfil
  nome_profissional VARCHAR(255),
  especialidade VARCHAR(255),
  mini_bio TEXT,
  url_foto VARCHAR(2000),
  whatsapp VARCHAR(500),
  url_perfil VARCHAR(255),
  link_video TEXT,
  imagens TEXT[],

  -- Status
  publicado BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(freelancer_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_perfis_publicos_freelancer_id ON perfis_publicos(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_perfis_publicos_url_perfil ON perfis_publicos(url_perfil);
CREATE INDEX IF NOT EXISTS idx_perfis_publicos_publicado ON perfis_publicos(publicado);

-- ============================================================
-- 8. TABELA USER SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configurações de proposta
  validade_proposta_padrao INT DEFAULT 15,
  unidade_validade validity_unit DEFAULT 'dias',
  formato_data date_format DEFAULT 'dd/mm/aaaa',

  -- Preferências
  auto_save_rascunhos BOOLEAN DEFAULT TRUE,

  -- Notificações
  notif_email BOOLEAN DEFAULT TRUE,
  notif_followup BOOLEAN DEFAULT TRUE,
  notif_propostas_expirando BOOLEAN DEFAULT TRUE,
  notif_pagamentos_pendentes BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================
-- 9. TABELA FEEDBACKS
-- ============================================================

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dados do feedback
  tipo VARCHAR(50) NOT NULL,
  mensagem TEXT NOT NULL,
  email VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_tipo ON feedbacks(tipo);

-- ============================================================
-- 10. TABELA SUBSCRIPTIONS (Stripe)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES freelancers(id) ON DELETE CASCADE,

  -- Dados do Stripe
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  stripe_product_id VARCHAR(255),

  -- Status (Stripe status)
  status VARCHAR(50) NOT NULL DEFAULT 'trialing',
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',

  -- Período
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Flags
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_freelancer_id ON subscriptions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================
-- 11. TABELA STRIPE EVENTS (Auditoria)
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados do evento
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,

  -- Status
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);

-- ============================================================
-- 12. TRIGGERS PARA UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabela com updated_at
DROP TRIGGER IF EXISTS trigger_freelancers_updated_at ON freelancers;
CREATE TRIGGER trigger_freelancers_updated_at
  BEFORE UPDATE ON freelancers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_clientes_updated_at ON clientes;
CREATE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_propostas_updated_at ON propostas;
CREATE TRIGGER trigger_propostas_updated_at
  BEFORE UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_contratos_updated_at ON contratos;
CREATE TRIGGER trigger_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_perfis_publicos_updated_at ON perfis_publicos;
CREATE TRIGGER trigger_perfis_publicos_updated_at
  BEFORE UPDATE ON perfis_publicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 13. TRIGGER PARA SINCRONIZAR SUBSCRIPTION COM FREELANCER
-- ============================================================

CREATE OR REPLACE FUNCTION sync_subscription_to_freelancer()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE freelancers
  SET
    plan_type = CASE
      WHEN NEW.status IN ('active', 'trialing') AND NEW.plan_type = 'pro' THEN 'pro'::plan_type
      ELSE 'free'::plan_type
    END,
    subscription_status = CASE
      WHEN NEW.status = 'active' THEN 'active'::subscription_status
      WHEN NEW.status = 'trialing' THEN 'trial'::subscription_status
      WHEN NEW.status IN ('canceled', 'unpaid', 'past_due') THEN 'expired'::subscription_status
      ELSE 'trial'::subscription_status
    END,
    stripe_customer_id = NEW.stripe_customer_id
  WHERE id = NEW.freelancer_id OR user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_subscription ON subscriptions;
CREATE TRIGGER trigger_sync_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_to_freelancer();

-- ============================================================
-- 14. TRIGGER PARA INICIALIZAR TRIAL EM NOVOS FREELANCERS
-- ============================================================

CREATE OR REPLACE FUNCTION initialize_freelancer_trial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_started_at IS NULL THEN
    NEW.trial_started_at = NOW();
  END IF;
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at = NOW() + INTERVAL '7 days';
  END IF;
  IF NEW.plan_type IS NULL THEN
    NEW.plan_type = 'free';
  END IF;
  IF NEW.subscription_status IS NULL THEN
    NEW.subscription_status = 'trial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_initialize_freelancer_trial ON freelancers;
CREATE TRIGGER trigger_initialize_freelancer_trial
  BEFORE INSERT ON freelancers
  FOR EACH ROW EXECUTE FUNCTION initialize_freelancer_trial();

-- ============================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_publicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 16. POLÍTICAS RLS - FREELANCERS
-- ============================================================

DROP POLICY IF EXISTS "freelancers_select_own" ON freelancers;
CREATE POLICY "freelancers_select_own" ON freelancers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "freelancers_insert_own" ON freelancers;
CREATE POLICY "freelancers_insert_own" ON freelancers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "freelancers_update_own" ON freelancers;
CREATE POLICY "freelancers_update_own" ON freelancers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "freelancers_delete_own" ON freelancers;
CREATE POLICY "freelancers_delete_own" ON freelancers
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 17. POLÍTICAS RLS - CLIENTES
-- ============================================================

DROP POLICY IF EXISTS "clientes_select_own" ON clientes;
CREATE POLICY "clientes_select_own" ON clientes
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "clientes_insert_own" ON clientes;
CREATE POLICY "clientes_insert_own" ON clientes
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "clientes_update_own" ON clientes;
CREATE POLICY "clientes_update_own" ON clientes
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "clientes_delete_own" ON clientes;
CREATE POLICY "clientes_delete_own" ON clientes
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- ============================================================
-- 18. POLÍTICAS RLS - PROPOSTAS
-- ============================================================

DROP POLICY IF EXISTS "propostas_select_own" ON propostas;
CREATE POLICY "propostas_select_own" ON propostas
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "propostas_insert_own" ON propostas;
CREATE POLICY "propostas_insert_own" ON propostas
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "propostas_update_own" ON propostas;
CREATE POLICY "propostas_update_own" ON propostas
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "propostas_delete_own" ON propostas;
CREATE POLICY "propostas_delete_own" ON propostas
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- ============================================================
-- 19. POLÍTICAS RLS - CONTRATOS
-- ============================================================

DROP POLICY IF EXISTS "contratos_select_own" ON contratos;
CREATE POLICY "contratos_select_own" ON contratos
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "contratos_insert_own" ON contratos;
CREATE POLICY "contratos_insert_own" ON contratos
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "contratos_update_own" ON contratos;
CREATE POLICY "contratos_update_own" ON contratos
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "contratos_delete_own" ON contratos;
CREATE POLICY "contratos_delete_own" ON contratos
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- ============================================================
-- 20. POLÍTICAS RLS - REGISTROS FINANCEIROS
-- ============================================================

DROP POLICY IF EXISTS "registros_financeiros_select_own" ON registros_financeiros;
CREATE POLICY "registros_financeiros_select_own" ON registros_financeiros
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "registros_financeiros_insert_own" ON registros_financeiros;
CREATE POLICY "registros_financeiros_insert_own" ON registros_financeiros
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "registros_financeiros_update_own" ON registros_financeiros;
CREATE POLICY "registros_financeiros_update_own" ON registros_financeiros
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "registros_financeiros_delete_own" ON registros_financeiros;
CREATE POLICY "registros_financeiros_delete_own" ON registros_financeiros
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- ============================================================
-- 21. POLÍTICAS RLS - PERFIS PÚBLICOS
-- ============================================================

DROP POLICY IF EXISTS "perfis_publicos_select_own" ON perfis_publicos;
CREATE POLICY "perfis_publicos_select_own" ON perfis_publicos
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
    OR publicado = TRUE
  );

DROP POLICY IF EXISTS "perfis_publicos_insert_own" ON perfis_publicos;
CREATE POLICY "perfis_publicos_insert_own" ON perfis_publicos
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "perfis_publicos_update_own" ON perfis_publicos;
CREATE POLICY "perfis_publicos_update_own" ON perfis_publicos
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "perfis_publicos_delete_own" ON perfis_publicos;
CREATE POLICY "perfis_publicos_delete_own" ON perfis_publicos
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- ============================================================
-- 22. POLÍTICAS RLS - USER SETTINGS
-- ============================================================

DROP POLICY IF EXISTS "user_settings_select_own" ON user_settings;
CREATE POLICY "user_settings_select_own" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_insert_own" ON user_settings;
CREATE POLICY "user_settings_insert_own" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update_own" ON user_settings;
CREATE POLICY "user_settings_update_own" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_delete_own" ON user_settings;
CREATE POLICY "user_settings_delete_own" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 23. POLÍTICAS RLS - FEEDBACKS
-- ============================================================

DROP POLICY IF EXISTS "feedbacks_insert_authenticated" ON feedbacks;
CREATE POLICY "feedbacks_insert_authenticated" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR user_id IS NULL);

DROP POLICY IF EXISTS "feedbacks_select_own" ON feedbacks;
CREATE POLICY "feedbacks_select_own" ON feedbacks
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================
-- 24. POLÍTICAS RLS - SUBSCRIPTIONS
-- ============================================================

DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_insert_service" ON subscriptions;
CREATE POLICY "subscriptions_insert_service" ON subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    current_setting('role', true) = 'service_role'
  );

DROP POLICY IF EXISTS "subscriptions_update_service" ON subscriptions;
CREATE POLICY "subscriptions_update_service" ON subscriptions
  FOR UPDATE USING (
    auth.uid() = user_id OR
    current_setting('role', true) = 'service_role'
  );

-- ============================================================
-- 25. POLÍTICAS RLS - STRIPE EVENTS (apenas service_role)
-- ============================================================

DROP POLICY IF EXISTS "stripe_events_service_only" ON stripe_events;
CREATE POLICY "stripe_events_service_only" ON stripe_events
  FOR ALL USING (current_setting('role', true) = 'service_role');

-- ============================================================
-- 26. FUNÇÃO HELPER - GET USER SUBSCRIPTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  stripe_subscription_id VARCHAR,
  status VARCHAR,
  plan_type VARCHAR,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.stripe_subscription_id,
    s.status,
    s.plan_type,
    s.current_period_end,
    s.cancel_at_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
