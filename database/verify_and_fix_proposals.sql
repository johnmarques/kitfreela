-- =====================================================
-- VERIFICACAO E CORRECAO DA TABELA PROPOSALS
-- Data: 2026-01-13
-- Descricao: Script para diagnosticar e corrigir
--            problemas de insercao na tabela proposals
-- =====================================================

-- =====================================================
-- PARTE 1: DIAGNOSTICO
-- Execute estas queries uma a uma para identificar o problema
-- =====================================================

-- 1.1 Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'proposals'
) AS tabela_existe;

-- 1.2 Verificar estrutura da tabela
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'proposals'
ORDER BY ordinal_position;

-- 1.3 Verificar se RLS esta habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'proposals';

-- 1.4 Listar todas as policies da tabela proposals
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'proposals';

-- 1.5 Verificar se o enum proposal_status existe
SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'proposal_status'
ORDER BY e.enumsortorder;

-- 1.6 Contar registros existentes
SELECT COUNT(*) AS total_propostas FROM proposals;

-- 1.7 Verificar usuario logado (deve retornar o UUID do usuario)
SELECT auth.uid() AS usuario_logado;


-- =====================================================
-- PARTE 2: CORRECOES (SE NECESSARIO)
-- Execute APENAS se identificar problemas no diagnostico
-- =====================================================

-- 2.1 Se as policies nao existirem, crie-as:
/*
-- Remover policies antigas (se existirem com nomes diferentes)
DROP POLICY IF EXISTS "proposals_select_own" ON proposals;
DROP POLICY IF EXISTS "proposals_insert_own" ON proposals;
DROP POLICY IF EXISTS "proposals_update_own" ON proposals;
DROP POLICY IF EXISTS "proposals_delete_own" ON proposals;

-- Criar policies corretas
CREATE POLICY "proposals_select_own" ON proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "proposals_insert_own" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proposals_update_own" ON proposals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "proposals_delete_own" ON proposals
  FOR DELETE USING (auth.uid() = user_id);
*/

-- 2.2 Se RLS nao estiver habilitado:
/*
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
*/

-- 2.3 Se o enum proposal_status nao existir:
/*
CREATE TYPE proposal_status AS ENUM (
  'rascunho',
  'enviada',
  'aceita',
  'encerrada',
  'expirada'
);
*/

-- 2.4 Se a coluna status nao usar o enum:
/*
ALTER TABLE proposals
ALTER COLUMN status TYPE proposal_status
USING status::proposal_status;
*/


-- =====================================================
-- PARTE 3: TESTE DE INSERCAO MANUAL
-- Use para testar se o INSERT funciona diretamente no SQL
-- SUBSTITUA 'SEU-USER-ID-AQUI' pelo UUID real do usuario
-- =====================================================

/*
INSERT INTO proposals (
  user_id,
  client_name,
  service,
  value,
  status
) VALUES (
  'SEU-USER-ID-AQUI'::uuid,  -- Substitua pelo auth.uid() real
  'Cliente Teste',
  'Servico Teste',
  1000.00,
  'rascunho'
)
RETURNING id, client_name, service, value, status, created_at;
*/

-- Teste com auth.uid() (so funciona se voce estiver logado):
/*
INSERT INTO proposals (
  user_id,
  client_name,
  service,
  value,
  status
) VALUES (
  auth.uid(),
  'Cliente Teste Auth',
  'Servico Teste Auth',
  1500.00,
  'rascunho'
)
RETURNING id, client_name, service, value, status, created_at;
*/


-- =====================================================
-- PARTE 4: GRANT DE PERMISSOES (SE NECESSARIO)
-- Execute se o usuario authenticated nao tiver permissao
-- =====================================================

/*
-- Garantir que usuarios autenticados podem usar a tabela
GRANT SELECT, INSERT, UPDATE, DELETE ON proposals TO authenticated;

-- Garantir acesso a sequencia (se houver)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
*/


-- =====================================================
-- INSTRUCOES DE USO:
--
-- 1. Execute as queries de DIAGNOSTICO (Parte 1) uma a uma
-- 2. Analise os resultados
-- 3. Se encontrar problemas, descomente e execute
--    as correcoes apropriadas (Parte 2)
-- 4. Teste com INSERT manual (Parte 3)
-- 5. Se ainda houver problemas, verifique grants (Parte 4)
--
-- PROBLEMAS COMUNS:
-- - RLS desabilitado: INSERT funciona mas SELECT nao
-- - Policy INSERT faltando: erro de permissao
-- - auth.uid() retornando NULL: usuario nao logado
-- - Enum nao existente: erro de tipo invalido
-- =====================================================
