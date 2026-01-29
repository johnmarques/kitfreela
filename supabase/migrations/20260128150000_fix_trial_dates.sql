-- ============================================================
-- KITFREELA - FIX: TRIAL DATES
-- ============================================================
-- Atualiza usuarios existentes que nao tem trial_started_at
-- e trial_ends_at definidos.
-- ============================================================

-- Atualiza trial_started_at para usuarios que nao tem
UPDATE freelancers
SET trial_started_at = created_at
WHERE trial_started_at IS NULL
  AND created_at IS NOT NULL;

-- Atualiza trial_ends_at baseado no trial_started_at
UPDATE freelancers
SET trial_ends_at = trial_started_at + INTERVAL '7 days'
WHERE trial_ends_at IS NULL
  AND trial_started_at IS NOT NULL;

-- Garante que plan_type e subscription_status estao definidos (com cast para ENUM)
UPDATE freelancers
SET
  plan_type = 'free'::plan_type,
  subscription_status = (CASE
    WHEN trial_ends_at IS NOT NULL AND trial_ends_at > NOW() THEN 'trial'
    WHEN trial_ends_at IS NOT NULL AND trial_ends_at <= NOW() THEN 'expired'
    ELSE 'trial'
  END)::subscription_status
WHERE plan_type IS NULL OR subscription_status IS NULL;

-- Atualiza usuarios com trial expirado para status 'expired'
UPDATE freelancers
SET subscription_status = 'expired'::subscription_status
WHERE plan_type = 'free'
  AND subscription_status = 'trial'
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at <= NOW();
