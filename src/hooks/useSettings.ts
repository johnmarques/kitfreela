import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { UserSettings, ValidityUnit, DateFormat } from '@/types'
import { DEFAULT_USER_SETTINGS } from '@/types'

// Chave para localStorage (fallback)
const STORAGE_KEY = 'kitfreela_user_settings'

// Helper para ler do localStorage
function getFromStorage(): UserSettings | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// Helper para salvar no localStorage
function saveToStorage(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

// Gerar ID unico
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Criar configuracoes padrao para novo usuario
function createDefaultSettings(userId: string): UserSettings {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    user_id: userId,
    ...DEFAULT_USER_SETTINGS,
    created_at: now,
    updated_at: now,
  }
}

// Buscar configuracoes do Supabase
async function fetchSettingsFromSupabase(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data as UserSettings | null
}

// Criar configuracoes no Supabase
async function createSettingsInSupabase(userId: string): Promise<UserSettings> {
  const now = new Date().toISOString()
  const newSettings = {
    user_id: userId,
    ...DEFAULT_USER_SETTINGS,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('user_settings')
    .insert(newSettings)
    .select()
    .single()

  if (error) throw error
  return data as UserSettings
}

// Atualizar configuracoes no Supabase
async function updateSettingsInSupabase(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserSettings
}

// Fetch principal - busca ou cria configuracoes
async function fetchOrCreateSettings(userId: string): Promise<UserSettings> {
  if (isSupabaseConfigured()) {
    try {
      // Tenta buscar configuracoes existentes
      let settings = await fetchSettingsFromSupabase(userId)

      // Se nao existir, cria novas configuracoes
      if (!settings) {
        settings = await createSettingsInSupabase(userId)
      }

      // Salva no localStorage como backup
      saveToStorage(settings)
      return settings
    } catch (error) {
      console.warn('Erro ao buscar configuracoes do Supabase, usando localStorage:', error)
      // Fallback para localStorage
      const localSettings = getFromStorage()
      if (localSettings && localSettings.user_id === userId) {
        return localSettings
      }
      const defaultSettings = createDefaultSettings(userId)
      saveToStorage(defaultSettings)
      return defaultSettings
    }
  } else {
    // Supabase nao configurado - usa localStorage
    const localSettings = getFromStorage()
    if (localSettings && localSettings.user_id === userId) {
      return localSettings
    }
    const defaultSettings = createDefaultSettings(userId)
    saveToStorage(defaultSettings)
    return defaultSettings
  }
}

// Salvar configuracoes
async function saveSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  if (isSupabaseConfigured()) {
    const updated = await updateSettingsInSupabase(userId, settings)
    saveToStorage(updated)
    return updated
  } else {
    // Fallback localStorage
    const current = getFromStorage()
    const updated: UserSettings = {
      ...(current || createDefaultSettings(userId)),
      ...settings,
      updated_at: new Date().toISOString(),
    }
    saveToStorage(updated)
    return updated
  }
}

// Hook principal para buscar configuracoes
export function useSettings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuario nao autenticado')
      }
      return fetchOrCreateSettings(user.id)
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para salvar configuracoes
export function useSaveSettings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      if (!user?.id) {
        throw new Error('Usuario nao autenticado')
      }
      return saveSettings(user.id, settings)
    },
    onSuccess: (data) => {
      // Atualiza o cache com os novos dados
      queryClient.setQueryData(['user_settings', user?.id], data)
    },
  })
}

// Tipo para o payload de atualizacao
export interface UpdateSettingsPayload {
  validade_proposta_padrao?: number
  unidade_validade?: ValidityUnit
  formato_data?: DateFormat
  auto_save_rascunhos?: boolean
  notif_email?: boolean
  notif_followup?: boolean
  notif_propostas_expirando?: boolean
  notif_pagamentos_pendentes?: boolean
}
