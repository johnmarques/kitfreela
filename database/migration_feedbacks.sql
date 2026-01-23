-- ============================================================
-- KITFREELA - MIGRATION: FEEDBACKS
-- ============================================================
-- Tabela para armazenar feedbacks dos usuarios
-- ============================================================

-- Criar tabela de feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vinculo com usuario
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de feedback
  tipo VARCHAR(50) NOT NULL,

  -- Dados do usuario (para contexto)
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,

  -- Mensagem do feedback
  mensagem TEXT NOT NULL,

  -- Pagina de origem (opcional)
  pagina VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_tipo ON feedbacks(tipo);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- Habilitar RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies RLS
-- Usuario pode inserir seus proprios feedbacks
CREATE POLICY "feedbacks_insert_own" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuario pode ver seus proprios feedbacks
CREATE POLICY "feedbacks_select_own" ON feedbacks
  FOR SELECT USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE feedbacks IS 'Feedbacks enviados pelos usuarios da plataforma';
COMMENT ON COLUMN feedbacks.tipo IS 'Tipo: feedback, sugestao, reclamacao, observacao, relato, depoimento';
COMMENT ON COLUMN feedbacks.pagina IS 'Pagina de onde o feedback foi enviado (opcional)';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
