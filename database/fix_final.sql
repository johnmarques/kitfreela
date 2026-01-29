-- ============================================================
-- KITFREELA - FIX FINAL: Colunas que faltam em freelancers
-- ============================================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Criar ENUMs (ignora se ja existir)
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

-- 2. Adicionar colunas em freelancers (ignora se ja existir)
DO $$ BEGIN
  ALTER TABLE freelancers ADD COLUMN plan_type plan_type DEFAULT 'free';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE freelancers ADD COLUMN subscription_status subscription_status DEFAULT 'trial';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE freelancers ADD COLUMN trial_started_at TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE freelancers ADD COLUMN trial_ends_at TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE freelancers ADD COLUMN stripe_customer_id VARCHAR(255);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 3. Atualizar usuarios existentes com trial de 7 dias
UPDATE freelancers
SET
  trial_started_at = COALESCE(trial_started_at, created_at),
  trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '7 days'),
  plan_type = COALESCE(plan_type, 'free'),
  subscription_status = COALESCE(subscription_status, 'trial')
WHERE trial_started_at IS NULL OR trial_ends_at IS NULL;

-- 4. Verificar resultado
SELECT
  id,
  nome,
  plan_type,
  subscription_status,
  trial_started_at,
  trial_ends_at,
  stripe_customer_id
FROM freelancers
LIMIT 5;
