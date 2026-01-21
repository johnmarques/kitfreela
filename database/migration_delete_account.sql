-- =====================================================
-- MIGRACAO: Funcao para exclusao completa de conta
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Esta funcao permite que usuarios excluam suas proprias contas
-- incluindo o registro no auth.users
-- =====================================================

-- Funcao RPC para deletar conta do usuario logado
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  freelancer_id_val uuid;
BEGIN
  -- Obter ID do usuario autenticado
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  -- Obter ID do freelancer (se existir)
  SELECT id INTO freelancer_id_val FROM freelancers WHERE user_id = current_user_id;

  -- Deletar registros financeiros
  DELETE FROM registros_financeiros WHERE user_id = current_user_id;

  -- Deletar contratos
  DELETE FROM contracts WHERE user_id = current_user_id;

  -- Deletar propostas
  DELETE FROM propostas WHERE freelancer_id = freelancer_id_val;

  -- Deletar clientes (vinculados ao freelancer)
  DELETE FROM clients WHERE freelancer_id = freelancer_id_val;

  -- Deletar configuracoes do usuario
  DELETE FROM user_settings WHERE user_id = current_user_id;

  -- Deletar perfil publico
  DELETE FROM perfis_publicos WHERE user_id = current_user_id;

  -- Deletar freelancer
  DELETE FROM freelancers WHERE user_id = current_user_id;

  -- Deletar usuario do auth.users (SECURITY DEFINER permite isso)
  DELETE FROM auth.users WHERE id = current_user_id;

END;
$$;

-- Conceder permissao para usuarios autenticados executarem a funcao
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Comentario para documentacao
COMMENT ON FUNCTION delete_user_account() IS 'Exclui completamente a conta do usuario logado, incluindo todos os dados relacionados e o registro no auth.users';
