-- ============================================================
-- MIGRACAO: Tabela propostas com RLS para freelancer_id
-- ============================================================
-- Esta migracao garante que a tabela 'propostas' e 'freelancers'
-- estejam configuradas corretamente para o fluxo de onboarding
-- automatico.
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. GARANTIR QUE A TABELA FREELANCERS EXISTE
-- ============================================================

CREATE TABLE IF NOT EXISTS freelancers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  person_type VARCHAR(2) DEFAULT 'pf',
  cpf VARCHAR(14),
  cnpj VARCHAR(18),
  city VARCHAR(100),
  state VARCHAR(2),
  whatsapp VARCHAR(20),
  professional_email VARCHAR(255),
  default_signature TEXT,
  plan VARCHAR(20) DEFAULT 'free',
  default_proposal_validity INTEGER DEFAULT 15,
  validity_unit VARCHAR(10) DEFAULT 'dias',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  auto_save_drafts BOOLEAN DEFAULT true,
  notif_email BOOLEAN DEFAULT true,
  notif_followup BOOLEAN DEFAULT true,
  notif_expiring_proposals BOOLEAN DEFAULT true,
  notif_pending_payments BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para freelancers
CREATE INDEX IF NOT EXISTS idx_freelancers_user_id ON freelancers(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancers_email ON freelancers(email);


-- ============================================================
-- 2. GARANTIR QUE A TABELA PROPOSTAS EXISTE
-- ============================================================

-- Cria tipo ENUM se nao existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status') THEN
    CREATE TYPE proposal_status AS ENUM (
      'rascunho',
      'enviada',
      'aceita',
      'encerrada',
      'expirada'
    );
  END IF;
END
$$;

-- Cria tabela propostas
CREATE TABLE IF NOT EXISTS propostas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  cliente_id UUID,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255),
  cliente_telefone VARCHAR(20),
  servico VARCHAR(255) NOT NULL,
  escopo TEXT,
  prazo VARCHAR(100),
  valor DECIMAL(12, 2) NOT NULL DEFAULT 0,
  forma_pagamento VARCHAR(100),
  status proposal_status DEFAULT 'rascunho',
  followup_data DATE,
  followup_canal VARCHAR(20),
  observacoes TEXT,
  validade_dias INTEGER DEFAULT 15,
  data_expiracao DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para propostas
CREATE INDEX IF NOT EXISTS idx_propostas_freelancer_id ON propostas(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_created_at ON propostas(created_at);
CREATE INDEX IF NOT EXISTS idx_propostas_cliente_nome ON propostas(cliente_nome);


-- ============================================================
-- 3. HABILITAR RLS NAS TABELAS
-- ============================================================

ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. POLICIES RLS - FREELANCERS
-- ============================================================
-- O usuario pode:
-- - Criar seu proprio registro (user_id = auth.uid())
-- - Ver, atualizar e deletar apenas seu proprio registro
-- ============================================================

-- Remove policies antigas se existirem
DROP POLICY IF EXISTS "freelancers_select_own" ON freelancers;
DROP POLICY IF EXISTS "freelancers_insert_own" ON freelancers;
DROP POLICY IF EXISTS "freelancers_update_own" ON freelancers;
DROP POLICY IF EXISTS "freelancers_delete_own" ON freelancers;

-- Cria novas policies
CREATE POLICY "freelancers_select_own" ON freelancers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "freelancers_insert_own" ON freelancers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "freelancers_update_own" ON freelancers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "freelancers_delete_own" ON freelancers
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 5. POLICIES RLS - PROPOSTAS
-- ============================================================
-- O usuario pode manipular propostas APENAS se:
-- - O freelancer_id pertence a um freelancer cujo user_id = auth.uid()
-- ============================================================

-- Remove policies antigas se existirem
DROP POLICY IF EXISTS "propostas_select_own" ON propostas;
DROP POLICY IF EXISTS "propostas_insert_own" ON propostas;
DROP POLICY IF EXISTS "propostas_update_own" ON propostas;
DROP POLICY IF EXISTS "propostas_delete_own" ON propostas;

-- Cria novas policies
CREATE POLICY "propostas_select_own" ON propostas
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "propostas_insert_own" ON propostas
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "propostas_update_own" ON propostas
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "propostas_delete_own" ON propostas
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );


-- ============================================================
-- 6. FUNCAO PARA AUTO-CRIAR FREELANCER (OPCIONAL)
-- ============================================================
-- Esta funcao pode ser usada como trigger, mas o frontend
-- ja faz essa criacao via ensureFreelancerExists()
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.freelancers (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria trigger para auto-criar freelancer (backup do frontend)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- FIM DA MIGRACAO
-- ============================================================
-- Apos executar este script:
-- 1. Verifique se as tabelas foram criadas
-- 2. Teste criando um novo usuario
-- 3. Verifique se o freelancer foi criado automaticamente
-- 4. Teste criando uma proposta
-- ============================================================
