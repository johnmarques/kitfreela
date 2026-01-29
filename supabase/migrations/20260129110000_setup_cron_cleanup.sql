-- ============================================================
-- KITFREELA - MIGRATION: CONFIGURA CRON JOB PARA LIMPEZA
-- ============================================================
-- Agenda execucao diaria da funcao de limpeza de contas
-- ============================================================

-- 1. Habilita extensao pg_cron (se ainda nao estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Habilita extensao pg_net para chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Remove job anterior se existir (para evitar duplicatas)
SELECT cron.unschedule('cleanup-expired-accounts')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-accounts'
);

-- 4. Agenda execucao diaria as 3h da manha (UTC)
-- Chama a Edge Function cleanup-expired-accounts
SELECT cron.schedule(
  'cleanup-expired-accounts',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://kprgoxojtzexuclwhotp.supabase.co/functions/v1/cleanup-expired-accounts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 5. Comentario para documentacao
COMMENT ON EXTENSION pg_cron IS 'Executa jobs agendados. Usado para limpeza automatica de contas bloqueadas.';
