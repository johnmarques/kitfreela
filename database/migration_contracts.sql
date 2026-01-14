-- ============================================================
-- MIGRACAO: Tabela contracts com RLS
-- ============================================================
-- Esta migracao garante que a tabela 'contracts' existe
-- com todas as colunas necessarias e RLS configurada.
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. CRIAR TIPOS ENUM SE NAO EXISTIREM
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM (
      'rascunho',
      'ativo',
      'finalizado',
      'cancelado'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'person_type') THEN
    CREATE TYPE person_type AS ENUM ('pf', 'pj');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deadline_mode') THEN
    CREATE TYPE deadline_mode AS ENUM ('days', 'date');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
    CREATE TYPE payment_type AS ENUM (
      'a-vista',
      '2x',
      '3x',
      '50-50',
      '30-70',
      'parcelado-acordo'
    );
  END IF;
END
$$;


-- ============================================================
-- 2. CRIAR TABELA CONTRACTS
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES propostas(id) ON DELETE SET NULL,

  -- Tipo de pessoa
  person_type VARCHAR(2) DEFAULT 'pf',

  -- Dados do cliente
  client_name VARCHAR(255) NOT NULL,
  client_document VARCHAR(20),
  client_rg VARCHAR(20),
  client_company_name VARCHAR(255),
  client_address TEXT,
  client_city VARCHAR(100),
  client_state VARCHAR(2),
  client_phone VARCHAR(20),
  client_email VARCHAR(255),

  -- Dados do servico
  service_name VARCHAR(255) NOT NULL,
  service_scope TEXT,
  deliverables TEXT,

  -- Valores
  value DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Prazo
  deadline_mode VARCHAR(10) DEFAULT 'days',
  deadline_days INTEGER,
  deadline_type VARCHAR(20),
  deadline_date DATE,

  -- Pagamento
  payment_type VARCHAR(30) DEFAULT 'a-vista',
  payment_installments JSONB,
  payment_notes TEXT,

  -- Status e texto
  status VARCHAR(20) DEFAULT 'rascunho',
  contract_text TEXT, -- IMPORTANTE: Texto completo do contrato

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);


-- ============================================================
-- 3. HABILITAR RLS
-- ============================================================

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. POLICIES RLS - CONTRACTS
-- ============================================================
-- O usuario pode manipular apenas seus proprios contratos
-- ============================================================

DROP POLICY IF EXISTS "contracts_select_own" ON contracts;
DROP POLICY IF EXISTS "contracts_insert_own" ON contracts;
DROP POLICY IF EXISTS "contracts_update_own" ON contracts;
DROP POLICY IF EXISTS "contracts_delete_own" ON contracts;

CREATE POLICY "contracts_select_own" ON contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contracts_insert_own" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contracts_update_own" ON contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "contracts_delete_own" ON contracts
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 5. TRIGGER PARA UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contracts_updated_at ON contracts;

CREATE TRIGGER trigger_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_contracts_updated_at();


-- ============================================================
-- 6. ADICIONAR COLUNA contract_text SE NAO EXISTIR
-- ============================================================
-- Para bancos que ja tem a tabela mas sem a coluna

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'contract_text'
  ) THEN
    ALTER TABLE contracts ADD COLUMN contract_text TEXT;
  END IF;
END
$$;


-- ============================================================
-- FIM DA MIGRACAO
-- ============================================================
