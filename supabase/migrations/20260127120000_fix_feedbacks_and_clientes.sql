-- ============================================================
-- MIGRACAO: CORRECOES FEEDBACKS E CLIENTES
-- ============================================================
-- 1. Adiciona colunas 'nome' e 'pagina' na tabela feedbacks
-- 2. Garante que tipo_pessoa existe na tabela clientes
--
-- Data: 2026-01-27
-- ============================================================

-- ============================================================
-- 1. TABELA FEEDBACKS - Adicionar colunas faltantes
-- ============================================================
-- O codigo FeedbackModal.tsx envia nome e pagina, mas essas
-- colunas nao existiam no schema original.

-- Adiciona coluna 'nome' se nao existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedbacks' AND column_name = 'nome'
    ) THEN
        ALTER TABLE feedbacks ADD COLUMN nome VARCHAR(255);
    END IF;
END $$;

-- Adiciona coluna 'pagina' se nao existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedbacks' AND column_name = 'pagina'
    ) THEN
        ALTER TABLE feedbacks ADD COLUMN pagina VARCHAR(255);
    END IF;
END $$;

-- ============================================================
-- 2. TABELA CLIENTES - Garantir coluna tipo_pessoa
-- ============================================================
-- Verifica se a coluna tipo_pessoa existe e tem o tipo correto

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clientes' AND column_name = 'tipo_pessoa'
    ) THEN
        ALTER TABLE clientes ADD COLUMN tipo_pessoa VARCHAR(2) DEFAULT 'pf';
    END IF;
END $$;

-- ============================================================
-- FIM DA MIGRACAO
-- ============================================================
