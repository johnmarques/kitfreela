-- ============================================================
-- MIGRATION: Criar tabela clients
-- ============================================================
-- Execute este script no SQL Editor do Supabase
-- Ordem de execucao: 1
-- ============================================================

-- Verificar se o enum person_type existe, senao criar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'person_type') THEN
    CREATE TYPE person_type AS ENUM ('pf', 'pj');
  END IF;
END $$;

-- ============================================================
-- TABELA: clients
-- ============================================================
-- Armazena os clientes do freelancer.
-- Clientes sao criados automaticamente a partir das propostas/contratos.
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com freelancer
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,

  -- Dados basicos
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),

  -- Tipo de pessoa
  person_type person_type DEFAULT 'pf',

  -- Documentos
  cpf VARCHAR(14),
  cnpj VARCHAR(18),
  rg VARCHAR(20),
  company_name VARCHAR(255),

  -- Endereco
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),

  -- Observacoes internas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_freelancer_id ON clients(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politica: Freelancer pode ver apenas seus proprios clientes
DROP POLICY IF EXISTS "clients_select_own" ON clients;
CREATE POLICY "clients_select_own" ON clients
  FOR SELECT USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Politica: Freelancer pode inserir clientes vinculados a ele
DROP POLICY IF EXISTS "clients_insert_own" ON clients;
CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Politica: Freelancer pode atualizar apenas seus proprios clientes
DROP POLICY IF EXISTS "clients_update_own" ON clients;
CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Politica: Freelancer pode deletar apenas seus proprios clientes
DROP POLICY IF EXISTS "clients_delete_own" ON clients;
CREATE POLICY "clients_delete_own" ON clients
  FOR DELETE USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- ============================================================
-- ADICIONAR COLUNA cliente_id NA TABELA propostas (se nao existir)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'propostas' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE propostas ADD COLUMN cliente_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    CREATE INDEX idx_propostas_cliente_id ON propostas(cliente_id);
  END IF;
END $$;

-- ============================================================
-- ADICIONAR COLUNA client_id NA TABELA contracts (se nao existir)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    CREATE INDEX idx_contracts_client_id ON contracts(client_id);
  END IF;
END $$;

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON TABLE clients IS 'Clientes do freelancer, criados automaticamente a partir de propostas e contratos.';
COMMENT ON COLUMN clients.freelancer_id IS 'FK para o freelancer dono deste cliente';
COMMENT ON COLUMN clients.person_type IS 'Tipo de pessoa: pf (fisica) ou pj (juridica)';
COMMENT ON COLUMN clients.cpf IS 'CPF para pessoa fisica';
COMMENT ON COLUMN clients.cnpj IS 'CNPJ para pessoa juridica';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
SELECT 'Migration clients executada com sucesso!' AS resultado;
