-- ============================================================
-- MIGRACAO: Tabela registros_financeiros
-- ============================================================
-- Controle manual de pagamentos recebidos
-- ============================================================

-- Criar tabela registros_financeiros
CREATE TABLE IF NOT EXISTS registros_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,
  descricao VARCHAR(255) NOT NULL,
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0,
  data_vencimento DATE,
  data_recebimento DATE,
  recebido BOOLEAN NOT NULL DEFAULT FALSE,
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_registros_financeiros_freelancer_id
  ON registros_financeiros(freelancer_id);

CREATE INDEX IF NOT EXISTS idx_registros_financeiros_contrato_id
  ON registros_financeiros(contrato_id);

CREATE INDEX IF NOT EXISTS idx_registros_financeiros_recebido
  ON registros_financeiros(recebido);

-- Habilitar RLS
ALTER TABLE registros_financeiros ENABLE ROW LEVEL SECURITY;

-- Politica: freelancer pode ver seus proprios registros
CREATE POLICY "Freelancer pode ver seus registros financeiros"
  ON registros_financeiros
  FOR SELECT
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Politica: freelancer pode inserir seus proprios registros
CREATE POLICY "Freelancer pode inserir registros financeiros"
  ON registros_financeiros
  FOR INSERT
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Politica: freelancer pode atualizar seus proprios registros
CREATE POLICY "Freelancer pode atualizar seus registros financeiros"
  ON registros_financeiros
  FOR UPDATE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Politica: freelancer pode excluir seus proprios registros
CREATE POLICY "Freelancer pode excluir seus registros financeiros"
  ON registros_financeiros
  FOR DELETE
  USING (
    freelancer_id IN (
      SELECT id FROM freelancers WHERE user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_registros_financeiros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_registros_financeiros_updated_at
  ON registros_financeiros;

CREATE TRIGGER trigger_update_registros_financeiros_updated_at
  BEFORE UPDATE ON registros_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION update_registros_financeiros_updated_at();

-- ============================================================
-- INSTRUCOES DE USO:
-- Execute este SQL no Supabase SQL Editor para criar a tabela
-- ============================================================