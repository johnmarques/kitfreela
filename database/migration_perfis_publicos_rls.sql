-- ============================================================
-- MIGRACAO: PERFIS_PUBLICOS - RLS PARA ACESSO ANONIMO
-- ============================================================
-- Este script configura as policies RLS para permitir:
-- 1. Freelancer autenticado gerenciar seu proprio perfil
-- 2. Usuarios anonimos visualizarem perfis publicados
--
-- Data: 2026-01-16
-- ============================================================

-- Garante que RLS esta habilitado
ALTER TABLE perfis_publicos ENABLE ROW LEVEL SECURITY;

-- Remove policies existentes para recriar (evita erros de duplicacao)
DROP POLICY IF EXISTS "perfis_publicos_select_own" ON perfis_publicos;
DROP POLICY IF EXISTS "perfis_publicos_insert_own" ON perfis_publicos;
DROP POLICY IF EXISTS "perfis_publicos_update_own" ON perfis_publicos;
DROP POLICY IF EXISTS "perfis_publicos_delete_own" ON perfis_publicos;
DROP POLICY IF EXISTS "perfis_publicos_select_published" ON perfis_publicos;
DROP POLICY IF EXISTS "perfis_publicos_anon_select" ON perfis_publicos;

-- ============================================================
-- POLICIES PARA USUARIOS AUTENTICADOS
-- ============================================================

-- Freelancer pode ver seu proprio perfil (mesmo nao publicado)
CREATE POLICY "perfis_publicos_select_own" ON perfis_publicos
  FOR SELECT
  TO authenticated
  USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- Freelancer pode inserir seu proprio perfil
CREATE POLICY "perfis_publicos_insert_own" ON perfis_publicos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- Freelancer pode atualizar seu proprio perfil
CREATE POLICY "perfis_publicos_update_own" ON perfis_publicos
  FOR UPDATE
  TO authenticated
  USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- Freelancer pode deletar seu proprio perfil
CREATE POLICY "perfis_publicos_delete_own" ON perfis_publicos
  FOR DELETE
  TO authenticated
  USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- ============================================================
-- POLICIES PARA USUARIOS ANONIMOS (PUBLICO)
-- ============================================================

-- Qualquer pessoa (anonimo) pode ver perfis publicados
CREATE POLICY "perfis_publicos_anon_select" ON perfis_publicos
  FOR SELECT
  TO anon
  USING (publicado = true);

-- Usuarios autenticados tambem podem ver perfis publicados de outros
CREATE POLICY "perfis_publicos_select_published" ON perfis_publicos
  FOR SELECT
  TO authenticated
  USING (publicado = true);

-- ============================================================
-- INDICES PARA PERFORMANCE
-- ============================================================

-- Indice para busca por slug (url_perfil)
CREATE INDEX IF NOT EXISTS idx_perfis_publicos_url_perfil ON perfis_publicos(url_perfil);

-- Indice para filtro por publicado
CREATE INDEX IF NOT EXISTS idx_perfis_publicos_publicado ON perfis_publicos(publicado);

-- Indice para busca por freelancer
CREATE INDEX IF NOT EXISTS idx_perfis_publicos_freelancer_id ON perfis_publicos(freelancer_id);

-- ============================================================
-- FIM DA MIGRACAO
-- ============================================================
--
-- INSTRUCOES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se as policies foram criadas em:
--    Table Editor > perfis_publicos > RLS policies
-- ============================================================
