-- ============================================================
-- KITFREELA - MIGRATION: DELETE ACCOUNT (V2)
-- ============================================================
-- Funcao RPC para preparar exclusao de conta
-- A exclusao do auth.users deve ser feita via Edge Function
-- ============================================================

-- Funcao para deletar todos os dados do usuario (exceto auth.users)
-- Esta funcao prepara a conta para exclusao do Auth via Edge Function
CREATE OR REPLACE FUNCTION prepare_account_deletion()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_freelancer_id uuid;
  deleted_counts json;
BEGIN
  -- Pega o user_id do usuario autenticado
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  -- Busca o freelancer_id
  SELECT id INTO v_freelancer_id
  FROM freelancers
  WHERE user_id = v_user_id;

  -- Deleta registros financeiros
  DELETE FROM registros_financeiros WHERE user_id = v_user_id;

  -- Deleta contratos
  DELETE FROM contracts WHERE user_id = v_user_id;

  -- Deleta propostas
  DELETE FROM proposals WHERE user_id = v_user_id;

  -- Deleta clientes (se o freelancer existir)
  IF v_freelancer_id IS NOT NULL THEN
    DELETE FROM clients WHERE freelancer_id = v_freelancer_id;
  END IF;

  -- Deleta perfil publico
  IF v_freelancer_id IS NOT NULL THEN
    DELETE FROM public_profiles WHERE freelancer_id = v_freelancer_id;
  END IF;

  -- Deleta configuracoes do usuario
  DELETE FROM user_settings WHERE user_id = v_user_id;

  -- Deleta feedbacks
  DELETE FROM feedbacks WHERE user_id = v_user_id;

  -- Deleta freelancer
  DELETE FROM freelancers WHERE user_id = v_user_id;

  -- Retorna sucesso
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Dados preparados para exclusao'
  );
END;
$$;

-- Grant para usuarios autenticados
GRANT EXECUTE ON FUNCTION prepare_account_deletion() TO authenticated;

-- Comentario
COMMENT ON FUNCTION prepare_account_deletion() IS 'Prepara a conta para exclusao deletando todos os dados do usuario. A exclusao do auth.users deve ser feita via Edge Function.';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
-- IMPORTANTE: Apos executar esta migration, voce precisa:
-- 1. Criar e deployar a Edge Function 'delete-account'
-- 2. A Edge Function usa service_role para deletar de auth.users
-- ============================================================
