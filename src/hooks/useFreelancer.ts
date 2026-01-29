import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// ============================================================
// HOOK PARA GERENCIAMENTO DO FREELANCER
// ============================================================
// Este hook garante que sempre exista um registro na tabela
// 'freelancers' vinculado ao usuario autenticado (auth.uid()).
//
// Resolve o problema de RLS onde propostas/documentos exigem
// um freelancer_id valido.
// ============================================================

// Tipo do registro do freelancer no banco
export interface FreelancerRecord {
  id: string
  user_id: string
  nome: string
  email: string
  person_type: 'pf' | 'pj' | null
  cpf: string | null
  cnpj: string | null
  city: string | null
  state: string | null
  whatsapp: string | null
  professional_email: string | null
  default_signature: string | null
  plan: string
  default_proposal_validity: number
  validity_unit: string
  date_format: string
  auto_save_drafts: boolean
  notif_email: boolean
  notif_followup: boolean
  notif_expiring_proposals: boolean
  notif_pending_payments: boolean
  // Consentimentos
  accepted_terms_at: string | null
  marketing_opt_in: boolean
  marketing_opt_in_at: string | null
  created_at: string
  updated_at: string
}

// Tipo minimo para criar um freelancer
interface FreelancerCreateData {
  user_id: string
  nome: string
  email: string
  accepted_terms_at?: string | null
  marketing_opt_in?: boolean
  marketing_opt_in_at?: string | null
}

// Tipo para atualizar o freelancer
export interface FreelancerUpdateData {
  nome?: string
  email?: string
  person_type?: 'pf' | 'pj'
  cpf?: string
  cnpj?: string
  city?: string
  state?: string
  whatsapp?: string
  professional_email?: string
  default_signature?: string
}

/**
 * Busca o freelancer do usuario atual
 */
async function fetchFreelancer(userId: string): Promise<FreelancerRecord | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[useFreelancer] Supabase nao configurado')
    return null
  }

  const { data, error } = await supabase
    .from('freelancers')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // PGRST116 = not found - nao e erro, apenas nao existe ainda
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[fetchFreelancer] Erro:', error)
    throw error
  }

  return data as FreelancerRecord
}

/**
 * Cria um novo freelancer para o usuario
 */
async function createFreelancer(data: FreelancerCreateData): Promise<FreelancerRecord> {
  console.log('[createFreelancer] Criando freelancer para user_id:', data.user_id)

  // Define datas do trial: 7 dias a partir de agora
  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data: created, error } = await supabase
    .from('freelancers')
    .insert({
      user_id: data.user_id,
      nome: data.nome,
      email: data.email,
      accepted_terms_at: data.accepted_terms_at || null,
      marketing_opt_in: data.marketing_opt_in || false,
      marketing_opt_in_at: data.marketing_opt_in_at || null,
      // Campos de trial - 7 dias gratis
      plan_type: 'free',
      subscription_status: 'trial',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    // Se erro de duplicidade, buscar o existente
    if (error.code === '23505') {
      console.log('[createFreelancer] Freelancer ja existe, buscando...')
      const existing = await fetchFreelancer(data.user_id)
      if (existing) return existing
    }
    console.error('[createFreelancer] Erro:', error)
    throw error
  }

  console.log('[createFreelancer] Freelancer criado! ID:', created.id)
  return created as FreelancerRecord
}

/**
 * Garante que existe um freelancer para o usuario.
 * Se nao existir, cria automaticamente.
 * Retorna o freelancer (existente ou recem-criado).
 */
export async function ensureFreelancerExists(
  userId: string,
  userEmail: string,
  userMetadata?: Record<string, unknown>
): Promise<FreelancerRecord> {
  console.log('[ensureFreelancerExists] Verificando freelancer para user_id:', userId)

  // Tenta buscar o freelancer existente
  const existing = await fetchFreelancer(userId)

  if (existing) {
    console.log('[ensureFreelancerExists] Freelancer encontrado! ID:', existing.id)
    return existing
  }

  // Nao existe, criar um novo
  console.log('[ensureFreelancerExists] Freelancer nao encontrado. Criando...')

  const nome = (userMetadata?.nome as string) || userEmail.split('@')[0] || 'Freelancer'

  return createFreelancer({
    user_id: userId,
    nome,
    email: userEmail,
    accepted_terms_at: userMetadata?.accepted_terms_at as string | null,
    marketing_opt_in: (userMetadata?.marketing_opt_in as boolean) || false,
    marketing_opt_in_at: userMetadata?.marketing_opt_in_at as string | null,
  })
}

/**
 * Atualiza os dados do freelancer
 */
async function updateFreelancer(
  id: string,
  data: FreelancerUpdateData
): Promise<FreelancerRecord> {
  console.log('[updateFreelancer] Atualizando freelancer:', id)

  const { data: updated, error } = await supabase
    .from('freelancers')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateFreelancer] Erro:', error)
    throw error
  }

  console.log('[updateFreelancer] Sucesso!')
  return updated as FreelancerRecord
}

// ============================================================
// HOOKS REACT QUERY
// ============================================================

/**
 * Hook principal para obter o freelancer do usuario atual.
 * Cria automaticamente se nao existir.
 */
export function useFreelancer() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['freelancer', user?.id],
    queryFn: async () => {
      if (!user?.id || !user?.email) {
        return null
      }

      // Garante que o freelancer existe
      const freelancer = await ensureFreelancerExists(
        user.id,
        user.email,
        user.user_metadata
      )

      return freelancer
    },
    enabled: !!user?.id && isSupabaseConfigured(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

/**
 * Hook para atualizar dados do freelancer
 */
export function useUpdateFreelancer() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FreelancerUpdateData }) => {
      return updateFreelancer(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer', user?.id] })
    },
  })
}

/**
 * Hook para obter apenas o ID do freelancer (mais leve)
 * Util para passar para outras funcoes que precisam do freelancer_id
 */
export function useFreelancerId() {
  const { data: freelancer, isLoading, error } = useFreelancer()

  return {
    freelancerId: freelancer?.id ?? null,
    isLoading,
    error,
    freelancer,
  }
}
