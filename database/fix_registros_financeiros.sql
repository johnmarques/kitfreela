-- ============================================================
-- FIX: Adicionar colunas faltantes na tabela registros_financeiros
-- ============================================================
-- Execute este script no Supabase SQL Editor se a tabela
-- ja existe mas esta faltando colunas
-- ============================================================

-- Adicionar coluna forma_pagamento se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registros_financeiros'
    AND column_name = 'forma_pagamento'
  ) THEN
    ALTER TABLE registros_financeiros ADD COLUMN forma_pagamento VARCHAR(50);
  END IF;
END $$;

-- Adicionar coluna observacoes se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registros_financeiros'
    AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE registros_financeiros ADD COLUMN observacoes TEXT;
  END IF;
END $$;

-- Adicionar coluna data_vencimento se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registros_financeiros'
    AND column_name = 'data_vencimento'
  ) THEN
    ALTER TABLE registros_financeiros ADD COLUMN data_vencimento DATE;
  END IF;
END $$;

-- Adicionar coluna data_recebimento se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registros_financeiros'
    AND column_name = 'data_recebimento'
  ) THEN
    ALTER TABLE registros_financeiros ADD COLUMN data_recebimento DATE;
  END IF;
END $$;

-- Adicionar coluna descricao se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registros_financeiros'
    AND column_name = 'descricao'
  ) THEN
    ALTER TABLE registros_financeiros ADD COLUMN descricao VARCHAR(255) NOT NULL DEFAULT 'Pagamento';
  END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registros_financeiros'
ORDER BY ordinal_position;
