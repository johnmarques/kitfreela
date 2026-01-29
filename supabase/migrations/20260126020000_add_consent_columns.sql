-- ============================================================
-- KITFREELA - Adicionar colunas de consentimento
-- ============================================================
-- Ajuste minimo: apenas adiciona colunas sem quebrar nada
-- ============================================================

-- Adicionar colunas de consentimento na tabela freelancers
ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT FALSE;

ALTER TABLE freelancers
ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;

-- Comentarios
COMMENT ON COLUMN freelancers.accepted_terms_at IS 'Data/hora em que o usuario aceitou os termos';
COMMENT ON COLUMN freelancers.marketing_opt_in IS 'Usuario optou por receber emails de marketing';
COMMENT ON COLUMN freelancers.marketing_opt_in_at IS 'Data/hora do opt-in de marketing';
