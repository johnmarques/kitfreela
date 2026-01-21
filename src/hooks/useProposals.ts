import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProposalStatus } from '@/types'

// ============================================================
// IMPORTANTE: Esta tabela se chama "propostas" no Supabase
// com colunas em português conforme schema abaixo:
// ============================================================
// - id (uuid)
// - freelancer_id (uuid)
// - cliente_id (uuid)
// - cliente_nome (varchar)
// - cliente_email (varchar)
// - cliente_telefone (varchar)
// - servico (varchar)
// - escopo (text)
// - prazo (varchar)
// - valor (numeric)
// - forma_pagamento (varchar)
// - status (proposal_status)
// - followup_data (date)
// - followup_canal (followup_channel)
// - observacoes (text)
// - validade_dias (int4)
// - data_expiracao (date)
// - created_at (timestamptz)
// - updated_at (timestamptz)
// ============================================================

// Tipo para dados do formulario (interface do frontend)
export interface ProposalFormData {
  cliente_id?: string // ID do cliente na tabela clients (opcional)
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  servico: string
  escopo?: string
  prazo?: string
  valor: number
  forma_pagamento?: string
  status: ProposalStatus
  followup_data?: string
  followup_canal?: string
  observacoes?: string
}

// Tipo do registro da proposta no banco
export interface ProposalRecord {
  id: string
  freelancer_id: string
  cliente_id: string | null
  cliente_nome: string
  cliente_email: string | null
  cliente_telefone: string | null
  servico: string
  escopo: string | null
  prazo: string | null
  valor: number
  forma_pagamento: string | null
  status: ProposalStatus
  followup_data: string | null
  followup_canal: string | null
  observacoes: string | null
  validade_dias: number | null
  data_expiracao: string | null
  created_at: string
  updated_at: string
}

// Criar proposta na tabela "propostas"
async function createProposal(
  freelancerId: string,
  data: ProposalFormData
): Promise<ProposalRecord> {
  console.log('[createProposal] Iniciando criacao...')
  console.log('[createProposal] freelancer_id:', freelancerId)

  // Prepara dados para o Supabase (colunas em portugues)
  const insertData = {
    freelancer_id: freelancerId,
    cliente_id: data.cliente_id || null, // ID do cliente na tabela clients
    cliente_nome: data.cliente_nome.trim(),
    cliente_email: data.cliente_email?.trim() || null,
    cliente_telefone: data.cliente_telefone?.trim() || null,
    servico: data.servico.trim(),
    escopo: data.escopo?.trim() || null,
    prazo: data.prazo?.trim() || null,
    valor: data.valor,
    forma_pagamento: data.forma_pagamento?.trim() || null,
    status: data.status,
    followup_data: data.followup_data?.trim() || null,
    followup_canal: data.followup_canal?.trim() || null,
    observacoes: data.observacoes?.trim() || null,
  }

  console.log('[createProposal] Payload:', insertData)

  const { data: inserted, error } = await supabase
    .from('propostas')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[createProposal] ERRO:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    throw error
  }

  console.log('[createProposal] Sucesso! ID:', inserted.id)
  return inserted as ProposalRecord
}

// Atualizar proposta existente
async function updateProposal(
  id: string,
  data: Partial<ProposalFormData>
): Promise<ProposalRecord> {
  console.log('[updateProposal] Atualizando:', id)

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.cliente_id !== undefined) updateData.cliente_id = data.cliente_id || null
  if (data.cliente_nome !== undefined) updateData.cliente_nome = data.cliente_nome.trim()
  if (data.cliente_email !== undefined) updateData.cliente_email = data.cliente_email?.trim() || null
  if (data.cliente_telefone !== undefined) updateData.cliente_telefone = data.cliente_telefone?.trim() || null
  if (data.servico !== undefined) updateData.servico = data.servico.trim()
  if (data.escopo !== undefined) updateData.escopo = data.escopo?.trim() || null
  if (data.prazo !== undefined) updateData.prazo = data.prazo?.trim() || null
  if (data.valor !== undefined) updateData.valor = data.valor
  if (data.forma_pagamento !== undefined) updateData.forma_pagamento = data.forma_pagamento?.trim() || null
  if (data.status !== undefined) updateData.status = data.status
  if (data.followup_data !== undefined) updateData.followup_data = data.followup_data?.trim() || null
  if (data.followup_canal !== undefined) updateData.followup_canal = data.followup_canal?.trim() || null
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null

  const { data: updated, error } = await supabase
    .from('propostas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateProposal] ERRO:', error)
    throw error
  }

  console.log('[updateProposal] Sucesso!')
  return updated as ProposalRecord
}

// Helper para extrair mensagem de erro
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const pgError = err as { code: string; message?: string }
    const messages: Record<string, string> = {
      '23505': 'Já existe um registro com esses dados.',
      '23503': 'Referência inválida. Verifique se está autenticado.',
      '42501': 'Sem permissão. Verifique as políticas RLS.',
      '22P02': 'Formato de dados inválido.',
      '23502': 'Campo obrigatório não preenchido.',
      'PGRST116': 'Registro não encontrado.',
      '42P01': 'Tabela não encontrada.',
    }
    return messages[pgError.code] || pgError.message || 'Erro no banco de dados.'
  }
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Erro desconhecido.'
}

// Hook para criar proposta
export function useCreateProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      freelancerId,
      data,
    }: {
      freelancerId: string
      data: ProposalFormData
    }) => {
      return await createProposal(freelancerId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Hook para atualizar proposta
export function useUpdateProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProposalFormData> }) => {
      return await updateProposal(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Hook para buscar proposta por ID
export function useProposalById(id: string | undefined) {
  return useQuery({
    queryKey: ['proposta', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ProposalRecord
    },
    enabled: !!id,
  })
}

// Hook para listar propostas
export function usePropostas() {
  return useQuery({
    queryKey: ['propostas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ProposalRecord[]
    },
  })
}
