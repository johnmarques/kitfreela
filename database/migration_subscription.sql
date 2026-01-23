-- ============================================================
-- KITFREELA - MIGRATION: SUBSCRIPTION / PLANOS
-- ============================================================
-- Adiciona campos para controle de plano e trial
-- Preparacao para integracao com Stripe
-- ============================================================

-- Criar ENUM para status de assinatura
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trial',
    'active',
    'expired',
    'blocked'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar ENUM para tipo de plano
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM (
    'free',
    'pro'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar novos campos na tabela freelancers
-- (usando ALTER TABLE para nao perder dados existentes)

-- Campo: plan_type (tipo do plano)
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS plan_type plan_type DEFAULT 'free';

-- Campo: trial_started_at (inicio do trial)
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- Campo: trial_ends_at (fim do trial)
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Campo: subscription_status (status da assinatura)
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial';

-- Atualizar usuarios existentes:
-- - Define trial_started_at como created_at
-- - Define trial_ends_at como created_at + 7 dias
-- - Status fica como 'trial' por padrao
UPDATE freelancers
SET
  trial_started_at = created_at,
  trial_ends_at = created_at + INTERVAL '7 days',
  subscription_status = 'trial',
  plan_type = 'free'
WHERE trial_started_at IS NULL;

-- Criar indice para consultas de status
CREATE INDEX IF NOT EXISTS idx_freelancers_subscription_status
ON freelancers(subscription_status);

CREATE INDEX IF NOT EXISTS idx_freelancers_trial_ends_at
ON freelancers(trial_ends_at);

-- Comentarios para documentacao
COMMENT ON COLUMN freelancers.plan_type IS 'Tipo do plano: free ou pro';
COMMENT ON COLUMN freelancers.trial_started_at IS 'Data de inicio do periodo trial';
COMMENT ON COLUMN freelancers.trial_ends_at IS 'Data de fim do periodo trial (7 dias apos cadastro)';
COMMENT ON COLUMN freelancers.subscription_status IS 'Status da assinatura: trial, active, expired, blocked';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
-- Execute este script no SQL Editor do Supabase
-- Usuarios existentes terao trial de 7 dias a partir do cadastro
-- Novos usuarios terao trial automaticamente configurado
-- ============================================================
