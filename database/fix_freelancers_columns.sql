-- ============================================================
-- KITFREELA - FIX: Adicionar colunas de subscription em freelancers
-- ============================================================
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Criar ENUMs se nao existirem
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'pro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar colunas na tabela freelancers
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS plan_type plan_type DEFAULT 'free';

ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial';

ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- 3. Criar indice para stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_freelancers_stripe_customer_id
ON freelancers(stripe_customer_id);

-- 4. Atualizar usuarios existentes para ter trial iniciado
UPDATE freelancers
SET
  trial_started_at = created_at,
  trial_ends_at = created_at + INTERVAL '7 days'
WHERE trial_started_at IS NULL;

-- 5. Comentarios
COMMENT ON COLUMN freelancers.plan_type IS 'Tipo do plano: free ou pro';
COMMENT ON COLUMN freelancers.subscription_status IS 'Status: trial, active, expired, blocked';
COMMENT ON COLUMN freelancers.trial_started_at IS 'Quando o trial comecou';
COMMENT ON COLUMN freelancers.trial_ends_at IS 'Quando o trial termina';
COMMENT ON COLUMN freelancers.stripe_customer_id IS 'ID do cliente no Stripe (cus_xxx)';

-- ============================================================
-- Verificacao
-- ============================================================
-- Execute para verificar se as colunas foram criadas:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'freelancers' AND column_name IN ('plan_type', 'subscription_status', 'trial_started_at', 'trial_ends_at', 'stripe_customer_id');
-- ============================================================
