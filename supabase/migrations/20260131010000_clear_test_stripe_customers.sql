-- Limpa stripe_customer_id de teste para permitir criacao de novos customers em modo live
-- Os customer IDs que comecam com cus_ foram criados no modo teste do Stripe

-- Limpa stripe_customer_id da tabela freelancers
UPDATE freelancers
SET stripe_customer_id = NULL
WHERE stripe_customer_id IS NOT NULL;

-- Limpa dados de subscriptions de teste (se existirem)
DELETE FROM subscriptions
WHERE stripe_customer_id IS NOT NULL
  AND stripe_customer_id LIKE 'cus_%';

-- Limpa stripe_events de teste (se existirem)
DELETE FROM stripe_events
WHERE stripe_event_id LIKE 'evt_test_%'
   OR (data::text LIKE '%test%');
