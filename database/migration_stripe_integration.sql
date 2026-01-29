-- ============================================================
-- KITFREELA - MIGRATION: STRIPE INTEGRATION
-- ============================================================
-- Tabela dedicada para assinaturas Stripe
-- Separada da tabela freelancers para melhor escalabilidade
-- ============================================================

-- 1. Adicionar stripe_customer_id na tabela freelancers
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_freelancers_stripe_customer_id
ON freelancers(stripe_customer_id);

COMMENT ON COLUMN freelancers.stripe_customer_id IS 'ID do cliente no Stripe (cus_xxx)';

-- 2. Criar tabela de subscriptions (assinaturas Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com usuario
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES freelancers(id) ON DELETE CASCADE,

  -- Dados do Stripe
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  stripe_product_id VARCHAR(255),

  -- Status da assinatura
  -- 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'
  status VARCHAR(50) NOT NULL DEFAULT 'trialing',

  -- Tipo do plano
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',

  -- Datas importantes
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadados
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_freelancer_id ON subscriptions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);

-- RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuario pode ver suas proprias subscriptions
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas service_role pode inserir/atualizar (via webhook)
CREATE POLICY "subscriptions_insert_service" ON subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    current_setting('role') = 'service_role'
  );

CREATE POLICY "subscriptions_update_service" ON subscriptions
  FOR UPDATE USING (
    auth.uid() = user_id OR
    current_setting('role') = 'service_role'
  );

-- 3. Criar tabela de eventos do Stripe (para auditoria)
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_event_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);

-- RLS para stripe_events (apenas service_role)
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_events_service_only" ON stripe_events
  FOR ALL USING (current_setting('role') = 'service_role');

-- 4. Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- 5. Funcao para sincronizar status com freelancers
CREATE OR REPLACE FUNCTION sync_subscription_to_freelancer()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o status na tabela freelancers baseado na subscription
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
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_to_freelancer();

-- 6. Funcao helper para buscar subscription ativa do usuario
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

-- Comentarios
COMMENT ON TABLE subscriptions IS 'Assinaturas do Stripe vinculadas aos usuarios';
COMMENT ON TABLE stripe_events IS 'Log de eventos recebidos do Stripe webhook';
COMMENT ON FUNCTION get_user_subscription IS 'Retorna a subscription mais recente do usuario';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
-- Execute este script no SQL Editor do Supabase
-- Apos executar, configure as secrets no Supabase:
-- - STRIPE_SECRET_KEY
-- - STRIPE_WEBHOOK_SECRET
-- - STRIPE_PRICE_ID_PRO (ex: price_xxx)
-- ============================================================
