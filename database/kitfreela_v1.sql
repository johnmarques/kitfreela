-- ============================================================
-- KITFREELA - BANCO DE DADOS v1
-- PostgreSQL / Supabase
-- ============================================================
-- Este arquivo contem a estrutura completa do banco de dados
-- para o MVP do KitFreela.
--
-- IMPORTANTE: Os nomes das tabelas e colunas estao em ingles
-- para manter compatibilidade com o codigo TypeScript existente.
--
-- Data: 2026-01-10
-- ============================================================


-- ============================================================
-- EXTENSOES
-- ============================================================

-- Habilita UUID (necessario para chaves primarias)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TIPOS ENUM
-- ============================================================

-- Status das propostas
-- rascunho: proposta em edicao
-- enviada: proposta enviada ao cliente
-- aceita: cliente aceitou a proposta
-- encerrada: proposta finalizada (contrato gerado ou trabalho concluido)
-- expirada: proposta expirou sem resposta
CREATE TYPE proposal_status AS ENUM (
  'rascunho',
  'enviada',
  'aceita',
  'encerrada',
  'expirada'
);

-- Status dos contratos
-- rascunho: contrato em edicao
-- ativo: contrato em execucao
-- finalizado: contrato concluido com sucesso
-- cancelado: contrato cancelado
CREATE TYPE contract_status AS ENUM (
  'rascunho',
  'ativo',
  'finalizado',
  'cancelado'
);

-- Tipo de pessoa (fisica ou juridica)
CREATE TYPE person_type AS ENUM (
  'pf',
  'pj'
);

-- Modo de prazo do contrato
CREATE TYPE deadline_mode AS ENUM (
  'days',
  'date'
);

-- Tipo de prazo (dias uteis ou corridos)
CREATE TYPE deadline_type_enum AS ENUM (
  'dias-uteis',
  'dias-corridos'
);

-- Tipo de pagamento
CREATE TYPE payment_type AS ENUM (
  'a-vista',
  '2x',
  '3x',
  '50-50',
  '30-70',
  'parcelado-acordo'
);

-- Metodo de pagamento
CREATE TYPE payment_method AS ENUM (
  'pix',
  'transferencia',
  'boleto',
  'cartao',
  'dinheiro'
);

-- Canal de follow-up
CREATE TYPE followup_channel AS ENUM (
  'whatsapp',
  'email',
  'telefone'
);


-- ============================================================
-- TABELA: freelancers
-- ============================================================
-- Armazena os dados do freelancer (usuario do sistema).
-- Cada freelancer esta vinculado a um usuario do Supabase Auth.
-- Esta tabela centraliza dados pessoais, profissionais e configuracoes.
-- ============================================================

CREATE TABLE freelancers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com auth.users do Supabase
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dados pessoais
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,

  -- Tipo de pessoa (PF ou PJ)
  person_type person_type DEFAULT 'pf',

  -- Dados fiscais
  cpf VARCHAR(14),
  cnpj VARCHAR(18),
  city VARCHAR(100),
  state VARCHAR(2),

  -- Dados de contato
  whatsapp VARCHAR(20),
  professional_email VARCHAR(255),

  -- Assinatura padrao (incluida automaticamente nos documentos)
  default_signature TEXT,

  -- Plano atual
  plan VARCHAR(20) DEFAULT 'free',

  -- Configuracoes de documentos
  default_proposal_validity INTEGER DEFAULT 15,
  validity_unit VARCHAR(10) DEFAULT 'dias',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  auto_save_drafts BOOLEAN DEFAULT true,

  -- Configuracoes de notificacoes
  notif_email BOOLEAN DEFAULT true,
  notif_followup BOOLEAN DEFAULT true,
  notif_expiring_proposals BOOLEAN DEFAULT true,
  notif_pending_payments BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para freelancers
CREATE INDEX idx_freelancers_user_id ON freelancers(user_id);
CREATE INDEX idx_freelancers_email ON freelancers(email);

COMMENT ON TABLE freelancers IS 'Armazena dados dos freelancers (usuarios do sistema). Vinculado a auth.users.';


-- ============================================================
-- TABELA: public_profiles
-- ============================================================
-- Armazena as informacoes do perfil publico do freelancer.
-- Usado para exibicao publica em uma URL personalizada.
-- ============================================================

CREATE TABLE public_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com freelancer
  freelancer_id UUID NOT NULL UNIQUE REFERENCES freelancers(id) ON DELETE CASCADE,

  -- Dados de identidade publica
  professional_name VARCHAR(255),
  specialty VARCHAR(255),
  mini_bio VARCHAR(200),
  photo_url TEXT,
  whatsapp VARCHAR(50),

  -- URL do perfil (slug unico)
  profile_url VARCHAR(100) UNIQUE,

  -- Video de apresentacao (YouTube embed)
  video_link TEXT,

  -- Portfolio (ate 6 imagens)
  images JSONB DEFAULT '[]'::jsonb,

  -- Status de publicacao
  published BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para public_profiles
CREATE INDEX idx_public_profiles_freelancer_id ON public_profiles(freelancer_id);
CREATE INDEX idx_public_profiles_profile_url ON public_profiles(profile_url);
CREATE INDEX idx_public_profiles_published ON public_profiles(published);

COMMENT ON TABLE public_profiles IS 'Perfil publico do freelancer para exibicao em URL personalizada.';


-- ============================================================
-- TABELA: clients
-- ============================================================
-- Armazena os clientes do freelancer.
-- Clientes podem ser criados automaticamente a partir das propostas.
-- ============================================================

CREATE TABLE clients (
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

-- Indices para clients
CREATE INDEX idx_clients_freelancer_id ON clients(freelancer_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);

COMMENT ON TABLE clients IS 'Clientes do freelancer, criados a partir de propostas ou manualmente.';


-- ============================================================
-- TABELA: proposals
-- ============================================================
-- Armazena as propostas comerciais criadas pelo freelancer.
-- E a tabela central do sistema, de onde derivam contratos.
-- ============================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com freelancer (user_id para compatibilidade com codigo)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vinculo opcional com cliente cadastrado
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Dados do cliente (para proposta sem cliente cadastrado)
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),

  -- Dados do servico
  service VARCHAR(255) NOT NULL,
  scope TEXT,
  deadline VARCHAR(100),

  -- Valores
  value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(100),

  -- Status da proposta
  status proposal_status DEFAULT 'rascunho',

  -- Follow-up
  followup_date DATE,
  followup_channel VARCHAR(20),

  -- Observacoes internas (nao aparecem no documento)
  notes TEXT,

  -- Validade da proposta
  validity_days INTEGER DEFAULT 15,
  expiration_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para proposals
CREATE INDEX idx_proposals_user_id ON proposals(user_id);
CREATE INDEX idx_proposals_client_id ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at);
CREATE INDEX idx_proposals_client_name ON proposals(client_name);
CREATE INDEX idx_proposals_followup_date ON proposals(followup_date);

COMMENT ON TABLE proposals IS 'Propostas comerciais criadas pelo freelancer.';


-- ============================================================
-- TABELA: contracts
-- ============================================================
-- Armazena os contratos gerados a partir de propostas aceitas
-- ou criados diretamente.
-- ============================================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com freelancer (user_id para compatibilidade com codigo)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vinculo opcional com proposta de origem
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

  -- Vinculo opcional com cliente cadastrado
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Tipo de pessoa do contratante
  person_type person_type DEFAULT 'pf',

  -- Dados do contratante
  client_name VARCHAR(255) NOT NULL,
  client_document VARCHAR(18),
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

  -- Valor
  value DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Prazo
  deadline_mode deadline_mode DEFAULT 'days',
  deadline_days INTEGER,
  deadline_type VARCHAR(20) DEFAULT 'dias-corridos',
  deadline_date DATE,

  -- Pagamento
  payment_type payment_type DEFAULT 'a-vista',
  payment_installments JSONB DEFAULT '[]'::jsonb,
  payment_notes TEXT,

  -- Status do contrato
  status contract_status DEFAULT 'rascunho',

  -- Texto completo do contrato (gerado)
  contract_text TEXT,

  -- Datas importantes
  start_date DATE,
  end_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para contracts
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_proposal_id ON contracts(proposal_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);
CREATE INDEX idx_contracts_client_name ON contracts(client_name);

COMMENT ON TABLE contracts IS 'Contratos gerados a partir de propostas aceitas ou criados diretamente.';


-- ============================================================
-- TABELA: financial_records
-- ============================================================
-- Armazena o controle financeiro manual do freelancer.
-- Valores a receber e valores ja recebidos.
-- ============================================================

CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com freelancer (user_id para compatibilidade com codigo)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vinculo opcional com contrato
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,

  -- Descricao do lancamento
  description VARCHAR(255) NOT NULL,

  -- Valores
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Datas
  due_date DATE,
  received_date DATE,

  -- Status de recebimento
  is_received BOOLEAN DEFAULT false,

  -- Metodo de pagamento
  payment_method payment_method,

  -- Observacoes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para financial_records
CREATE INDEX idx_financial_records_user_id ON financial_records(user_id);
CREATE INDEX idx_financial_records_contract_id ON financial_records(contract_id);
CREATE INDEX idx_financial_records_is_received ON financial_records(is_received);
CREATE INDEX idx_financial_records_due_date ON financial_records(due_date);

COMMENT ON TABLE financial_records IS 'Controle financeiro manual de valores a receber e recebidos.';


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Habilita RLS em todas as tabelas para seguranca por usuario.
-- As policies garantem que cada freelancer so ve seus proprios dados.
-- ============================================================

-- Habilitar RLS nas tabelas
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- POLICIES RLS - FREELANCERS
-- ============================================================

CREATE POLICY "freelancers_select_own" ON freelancers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "freelancers_insert_own" ON freelancers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "freelancers_update_own" ON freelancers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "freelancers_delete_own" ON freelancers
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- POLICIES RLS - PUBLIC PROFILES
-- ============================================================

-- Qualquer pessoa pode ver perfis publicados
CREATE POLICY "public_profiles_select_published" ON public_profiles
  FOR SELECT USING (published = true);

-- Freelancer pode ver seu proprio perfil (mesmo nao publicado)
CREATE POLICY "public_profiles_select_own" ON public_profiles
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "public_profiles_insert_own" ON public_profiles
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "public_profiles_update_own" ON public_profiles
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "public_profiles_delete_own" ON public_profiles
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );


-- ============================================================
-- POLICIES RLS - CLIENTS
-- ============================================================

CREATE POLICY "clients_select_own" ON clients
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "clients_delete_own" ON clients
  FOR DELETE USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );


-- ============================================================
-- POLICIES RLS - PROPOSALS
-- ============================================================

CREATE POLICY "proposals_select_own" ON proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "proposals_insert_own" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proposals_update_own" ON proposals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "proposals_delete_own" ON proposals
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- POLICIES RLS - CONTRACTS
-- ============================================================

CREATE POLICY "contracts_select_own" ON contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contracts_insert_own" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contracts_update_own" ON contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "contracts_delete_own" ON contracts
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- POLICIES RLS - FINANCIAL RECORDS
-- ============================================================

CREATE POLICY "financial_records_select_own" ON financial_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "financial_records_insert_own" ON financial_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "financial_records_update_own" ON financial_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "financial_records_delete_own" ON financial_records
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
--
-- PROXIMOS PASSOS:
-- 1. Apague as tabelas antigas no Supabase (se existirem)
-- 2. Execute este script no SQL Editor do Supabase
-- 3. Verifique se todas as tabelas foram criadas corretamente
-- 4. Atualize o .env com a chave anon key correta
--
-- NOTA: Este script nao inclui triggers, functions ou automacoes.
-- Essas funcionalidades podem ser adicionadas posteriormente
-- conforme necessidade.
-- ============================================================
