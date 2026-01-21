import { createContext, useContext, ReactNode } from 'react'
import { useSettings, useSaveSettings, UpdateSettingsPayload } from '@/hooks/useSettings'
import type { UserSettings, DateFormat } from '@/types'
import { DEFAULT_USER_SETTINGS } from '@/types'

// ============================================================
// CONTEXTO DE CONFIGURACOES DO USUARIO
// ============================================================
// Disponibiliza as configuracoes globalmente para toda a aplicacao
// ============================================================

interface SettingsContextType {
  settings: UserSettings | null
  isLoading: boolean
  error: Error | null
  saveSettings: (data: UpdateSettingsPayload) => Promise<void>
  isSaving: boolean
  // Helpers para formatacao
  formatDate: (dateStr: string) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { data: settings, isLoading, error } = useSettings()
  const { mutateAsync: saveSettingsMutation, isPending: isSaving } = useSaveSettings()

  // Funcao para salvar configuracoes
  const saveSettings = async (data: UpdateSettingsPayload) => {
    await saveSettingsMutation(data)
  }

  // Funcao para formatar data baseado nas configuracoes do usuario
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''

    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr

      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()

      const formato: DateFormat = settings?.formato_data || DEFAULT_USER_SETTINGS.formato_data

      switch (formato) {
        case 'dd/mm/aaaa':
          return `${day}/${month}/${year}`
        case 'mm/dd/aaaa':
          return `${month}/${day}/${year}`
        case 'aaaa-mm-dd':
          return `${year}-${month}-${day}`
        default:
          return `${day}/${month}/${year}`
      }
    } catch {
      return dateStr
    }
  }

  const value: SettingsContextType = {
    settings: settings || null,
    isLoading,
    error: error as Error | null,
    saveSettings,
    isSaving,
    formatDate,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook para usar o contexto de configuracoes
 */
export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettingsContext deve ser usado dentro de um SettingsProvider')
  }
  return context
}

/**
 * Hook helper para obter apenas a funcao de formatacao de data
 */
export function useDateFormat() {
  const { formatDate, settings } = useSettingsContext()
  return { formatDate, formato: settings?.formato_data }
}

/**
 * Hook helper para obter configuracoes de documentos
 */
export function useDocumentSettings() {
  const { settings } = useSettingsContext()
  return {
    validadePadrao: settings?.validade_proposta_padrao || DEFAULT_USER_SETTINGS.validade_proposta_padrao,
    unidadeValidade: settings?.unidade_validade || DEFAULT_USER_SETTINGS.unidade_validade,
    autoSaveRascunhos: settings?.auto_save_rascunhos ?? DEFAULT_USER_SETTINGS.auto_save_rascunhos,
  }
}
