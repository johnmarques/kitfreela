-- ============================================================
-- MIGRACAO: FIX PERFIS_PUBLICOS - TAMANHO DAS COLUNAS
-- ============================================================
-- Este script corrige o tamanho das colunas que estao causando
-- erro "value too long for type character varying(20)"
--
-- Problema: A coluna 'whatsapp' tem limite de 20 caracteres,
-- mas o codigo converte numeros para links completos:
-- Ex: "5511999999999" -> "https://wa.me/5511999999999" (29 chars)
--
-- Esta migracao APENAS aumenta o tamanho das colunas.
-- NAO altera dados existentes nem remove colunas.
--
-- Data: 2026-01-26
-- ============================================================

-- Aumenta o tamanho da coluna whatsapp para comportar links completos
-- VARCHAR(20) -> VARCHAR(500)
ALTER TABLE perfis_publicos
ALTER COLUMN whatsapp TYPE VARCHAR(500);

-- Verifica e ajusta url_foto caso esteja com limite pequeno
-- (URLs de imagens podem ser longas)
ALTER TABLE perfis_publicos
ALTER COLUMN url_foto TYPE VARCHAR(2000);

-- Verifica e ajusta url_perfil para slugs mais longos
ALTER TABLE perfis_publicos
ALTER COLUMN url_perfil TYPE VARCHAR(255);

-- ============================================================
-- VERIFICACAO
-- ============================================================
-- Execute para confirmar que as colunas foram alteradas:
--
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'perfis_publicos'
-- AND column_name IN ('whatsapp', 'url_foto', 'url_perfil');
--
-- Resultado esperado:
-- whatsapp  | character varying | 500
-- url_foto  | character varying | 2000
-- url_perfil| character varying | 255
-- ============================================================

-- ============================================================
-- FIM DA MIGRACAO
-- ============================================================
