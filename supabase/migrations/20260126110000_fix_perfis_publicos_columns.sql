-- ============================================================
-- MIGRACAO: FIX PERFIS_PUBLICOS - TAMANHO DAS COLUNAS
-- ============================================================
-- Corrige o erro "value too long for type character varying(20)"
-- ao salvar links de WhatsApp no perfil publico.
--
-- Data: 2026-01-26
-- ============================================================

-- Aumenta o tamanho da coluna whatsapp para comportar links completos
-- VARCHAR(20) -> VARCHAR(500)
-- Ex: "https://wa.me/5511999999999" tem 29+ caracteres
ALTER TABLE IF EXISTS perfis_publicos
ALTER COLUMN whatsapp TYPE VARCHAR(500);

-- Aumenta o tamanho da coluna url_foto para URLs mais longas
-- VARCHAR(500) -> VARCHAR(2000)
ALTER TABLE IF EXISTS perfis_publicos
ALTER COLUMN url_foto TYPE VARCHAR(2000);

-- ============================================================
-- FIM DA MIGRACAO
-- ============================================================
