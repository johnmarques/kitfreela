-- ============================================================
-- KITFREELA - MIGRATION: BLOCKED_AT E AUTO DELETE
-- ============================================================
-- Adiciona campo blocked_at para rastrear quando a conta foi
-- bloqueada. Usado para exclusao automatica apos 60 dias.
-- ============================================================

-- 1. Adiciona campo blocked_at na tabela freelancers
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- 2. Cria indice para consultas de contas bloqueadas
CREATE INDEX IF NOT EXISTS idx_freelancers_blocked_at
ON freelancers(blocked_at)
WHERE blocked_at IS NOT NULL;

-- 3. Atualiza blocked_at para contas que ja estao expiradas
-- (baseado em trial_ends_at)
UPDATE freelancers
SET blocked_at = trial_ends_at
WHERE subscription_status IN ('expired', 'blocked')
  AND blocked_at IS NULL
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at < NOW();

-- 4. Funcao para atualizar blocked_at automaticamente
-- quando subscription_status muda para expired/blocked
CREATE OR REPLACE FUNCTION update_blocked_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se mudou para expired ou blocked, define blocked_at
  IF NEW.subscription_status IN ('expired', 'blocked')
     AND OLD.subscription_status NOT IN ('expired', 'blocked') THEN
    NEW.blocked_at = NOW();
  END IF;

  -- Se voltou a ficar ativo (assinou PRO), limpa blocked_at
  IF NEW.subscription_status IN ('active', 'trial')
     AND NEW.plan_type = 'pro' THEN
    NEW.blocked_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para chamar a funcao
DROP TRIGGER IF EXISTS trigger_update_blocked_at ON freelancers;
CREATE TRIGGER trigger_update_blocked_at
BEFORE UPDATE ON freelancers
FOR EACH ROW
EXECUTE FUNCTION update_blocked_at();

-- 6. Funcao para excluir contas bloqueadas ha mais de 60 dias
-- Esta funcao sera chamada por um cron job
CREATE OR REPLACE FUNCTION delete_expired_blocked_accounts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  freelancer_record RECORD;
BEGIN
  -- Busca contas bloqueadas ha mais de 60 dias
  FOR freelancer_record IN
    SELECT f.id, f.user_id, f.stripe_customer_id
    FROM freelancers f
    WHERE f.blocked_at IS NOT NULL
      AND f.blocked_at < NOW() - INTERVAL '60 days'
      AND f.subscription_status IN ('expired', 'blocked')
      AND f.plan_type = 'free'
  LOOP
    BEGIN
      -- Deleta em cascata (ordem importa por foreign keys)
      DELETE FROM registros_financeiros WHERE freelancer_id = freelancer_record.id;
      DELETE FROM contratos WHERE freelancer_id = freelancer_record.id;
      DELETE FROM propostas WHERE freelancer_id = freelancer_record.id;
      DELETE FROM clientes WHERE freelancer_id = freelancer_record.id;
      DELETE FROM perfis_publicos WHERE freelancer_id = freelancer_record.id;
      DELETE FROM subscriptions WHERE user_id = freelancer_record.user_id;
      DELETE FROM feedbacks WHERE user_id = freelancer_record.user_id;
      DELETE FROM user_settings WHERE user_id = freelancer_record.user_id;
      DELETE FROM freelancers WHERE id = freelancer_record.id;

      -- Nota: A exclusao do usuario no auth.users deve ser feita
      -- via Edge Function com service_role_key (nao pode ser feita aqui)
      -- O cron job deve chamar a edge function para cada usuario

      deleted_count := deleted_count + 1;

      RAISE NOTICE 'Conta excluida: user_id=%, freelancer_id=%',
        freelancer_record.user_id, freelancer_record.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao excluir conta %: %', freelancer_record.id, SQLERRM;
    END;
  END LOOP;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentarios para documentacao
COMMENT ON COLUMN freelancers.blocked_at IS 'Data em que a conta foi bloqueada. Usada para exclusao automatica apos 60 dias.';
COMMENT ON FUNCTION delete_expired_blocked_accounts() IS 'Exclui contas bloqueadas ha mais de 60 dias. Deve ser chamada por cron job diario.';

-- ============================================================
-- IMPORTANTE: Para ativar a exclusao automatica, configure um
-- cron job no Supabase Dashboard > Database > Extensions > pg_cron:
--
-- SELECT cron.schedule(
--   'delete-expired-accounts',
--   '0 3 * * *',  -- Executa todos os dias as 3h da manha
--   $$SELECT delete_expired_blocked_accounts()$$
-- );
-- ============================================================
