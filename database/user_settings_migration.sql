-- =====================================================
-- MIGRACAO: Criar tabela user_settings
-- Data: 2026-01-12
-- Descricao: Separacao das configuracoes de usuario
--            da tabela freelancers para user_settings
-- =====================================================

-- 1. Criar tabela user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preferencias de documentos
  validade_proposta_padrao INTEGER DEFAULT 30,
  unidade_validade VARCHAR(20) DEFAULT 'dias',
  formato_data VARCHAR(20) DEFAULT 'dd/mm/aaaa',
  auto_save_rascunhos BOOLEAN DEFAULT true,

  -- Configuracoes de notificacoes
  notif_email BOOLEAN DEFAULT true,
  notif_followup BOOLEAN DEFAULT true,
  notif_propostas_expirando BOOLEAN DEFAULT true,
  notif_pagamentos_pendentes BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Garantir que cada usuario tenha apenas um registro
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- 2. Criar indice para buscas por user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 4. Criar politica de SELECT - usuarios so podem ver suas proprias configuracoes
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Criar politica de INSERT - usuarios so podem criar suas proprias configuracoes
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Criar politica de UPDATE - usuarios so podem atualizar suas proprias configuracoes
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Criar politica de DELETE - usuarios so podem deletar suas proprias configuracoes
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- =====================================================
-- INSTRUCOES PARA EXECUCAO:
-- 1. Acesse o Supabase Dashboard
-- 2. Va em SQL Editor
-- 3. Cole e execute este script
-- 4. Verifique se a tabela foi criada em Table Editor
-- =====================================================
