-- Insere a subscription ativa do Stripe que nao foi processada pelo webhook
-- Subscription ID: sub_1SvUin2MUd9YMUhjwmTH2ygZ
-- Customer ID: cus_TtHH0RKo5Gt4gu
-- User: JOHN LENNON MARQUES CAVALCANTE

INSERT INTO subscriptions (
  user_id,
  freelancer_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  stripe_product_id,
  status,
  plan_type,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  'e56a2a4c-2c7e-4a3e-81fe-6a5cb786728a',
  '787b6027-1e60-4e79-9aed-c4662efc0dc6',
  'cus_TtHH0RKo5Gt4gu',
  'sub_1SvUin2MUd9YMUhjwmTH2ygZ',
  'price_1SsAiT2MUd9YMUhjbX3Ss9I5',
  'prod_TpqPq0Y2Wt4ju0',
  'active',
  'pro',
  to_timestamp(1769829581),
  to_timestamp(1772248781),
  false,
  NOW(),
  NOW()
) ON CONFLICT (stripe_subscription_id) DO UPDATE SET
  status = 'active',
  plan_type = 'pro',
  current_period_end = to_timestamp(1772248781),
  updated_at = NOW();

-- Atualiza tambem o freelancer para refletir o plano PRO
UPDATE freelancers
SET
  plan_type = 'pro',
  subscription_status = 'active',
  stripe_customer_id = 'cus_TtHH0RKo5Gt4gu',
  updated_at = NOW()
WHERE user_id = 'e56a2a4c-2c7e-4a3e-81fe-6a5cb786728a';
