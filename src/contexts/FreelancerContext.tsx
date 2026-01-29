import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { ensureFreelancerExists, FreelancerRecord } from '@/hooks/useFreelancer'
import { isSupabaseConfigured } from '@/lib/supabase'

// ============================================================
// CONTEXTO DO FREELANCER
// ============================================================
// Este contexto garante que o registro do freelancer existe
// e esta disponivel para toda a aplicacao logo apos o login.
//
// Resolve o problema de RLS onde propostas/documentos exigem
// um freelancer_id valido antes de qualquer operacao.
// ============================================================

interface FreelancerContextType {
  freelancer: FreelancerRecord | null
  freelancerId: string | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const FreelancerContext = createContext<FreelancerContextType | undefined>(undefined)

interface FreelancerProviderProps {
  children: ReactNode
}

export function FreelancerProvider({ children }: FreelancerProviderProps) {
  const { user, loading: authLoading } = useAuth()
  const [freelancer, setFreelancer] = useState<FreelancerRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Funcao para buscar/criar o freelancer
  const fetchOrCreateFreelancer = async () => {
    // Se nao tem usuario ou auth ainda carregando, aguarda
    if (!user?.id || !user?.email) {
      setFreelancer(null)
      setIsLoading(false)
      return
    }

    // Se Supabase nao configurado, nao faz nada
    if (!isSupabaseConfigured()) {
      console.warn('[FreelancerProvider] Supabase nao configurado')
      setFreelancer(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('[FreelancerProvider] Garantindo que freelancer existe...')

      const result = await ensureFreelancerExists(
        user.id,
        user.email,
        user.user_metadata
      )

      console.log('[FreelancerProvider] Freelancer pronto! ID:', result.id)
      setFreelancer(result)
    } catch (err) {
      console.error('[FreelancerProvider] Erro ao garantir freelancer:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do freelancer')
      setFreelancer(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Carrega o freelancer quando o usuario muda
  useEffect(() => {
    // Aguarda o auth terminar de carregar
    if (authLoading) {
      return
    }

    fetchOrCreateFreelancer()
  }, [user?.id, authLoading])

  // Funcao para refetch manual
  const refetch = async () => {
    await fetchOrCreateFreelancer()
  }

  const value: FreelancerContextType = {
    freelancer,
    freelancerId: freelancer?.id ?? null,
    isLoading: authLoading || isLoading,
    error,
    refetch,
  }

  return (
    <FreelancerContext.Provider value={value}>
      {children}
    </FreelancerContext.Provider>
  )
}

/**
 * Hook para usar o contexto do freelancer
 */
export function useFreelancerContext() {
  const context = useContext(FreelancerContext)
  if (context === undefined) {
    throw new Error('useFreelancerContext deve ser usado dentro de um FreelancerProvider')
  }
  return context
}

/**
 * Hook helper que retorna apenas o freelancerId
 * Util para componentes que so precisam do ID
 */
export function useFreelancerIdFromContext() {
  const { freelancerId, isLoading, error } = useFreelancerContext()
  return { freelancerId, isLoading, error }
}
