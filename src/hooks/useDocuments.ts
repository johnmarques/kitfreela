import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProposalStatus, ContractStatus } from '@/types'

// ============================================================
// Este hook busca da tabela "propostas" (colunas em portugues)
// e converte para interface Document (campos em ingles)
// ============================================================

// Tipo do registro no banco (colunas em portugues)
interface PropostaDB {
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

// Tipo unificado para documento (interface do frontend)
export interface Document {
  id: string
  type: 'proposal' | 'contract'
  title: string
  client_name: string
  client_email?: string
  client_phone?: string
  value: number
  status: ProposalStatus | ContractStatus
  created_at: string
  updated_at: string
  service?: string
  scope?: string
  deadline?: string
  payment_method?: string
  followup_date?: string
  followup_channel?: string
  notes?: string
  // Campos de contrato
  proposal_id?: string
  client_document?: string
  client_address?: string
  service_name?: string
  deliverables?: string
  deadline_mode?: 'days' | 'date'
  deadline_days?: number
  deadline_type?: 'dias-uteis' | 'dias-corridos'
  deadline_date?: string
  payment_type?: string
  payment_notes?: string
  contract_text?: string // Texto completo do contrato (para PDF)
}

// Converte registro do banco para Document
function propostaToDocument(proposta: PropostaDB): Document {
  return {
    id: proposta.id,
    type: 'proposal',
    title: `Proposta - ${proposta.servico} (${proposta.cliente_nome})`,
    client_name: proposta.cliente_nome,
    client_email: proposta.cliente_email || undefined,
    client_phone: proposta.cliente_telefone || undefined,
    value: proposta.valor,
    status: proposta.status,
    created_at: proposta.created_at,
    updated_at: proposta.updated_at,
    service: proposta.servico,
    scope: proposta.escopo || undefined,
    deadline: proposta.prazo || undefined,
    payment_method: proposta.forma_pagamento || undefined,
    followup_date: proposta.followup_data || undefined,
    followup_channel: proposta.followup_canal || undefined,
    notes: proposta.observacoes || undefined,
  }
}

// Buscar propostas do Supabase
async function fetchPropostas(): Promise<PropostaDB[]> {
  console.log('[useDocuments] Buscando propostas...')

  const { data, error } = await supabase
    .from('propostas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useDocuments] Erro ao buscar propostas:', error)
    throw error
  }

  console.log('[useDocuments] Propostas encontradas:', data?.length || 0)
  return (data as PropostaDB[]) || []
}

// Buscar contratos do Supabase (tabela: contratos - PORTUGUES)
async function fetchContratos(): Promise<Document[]> {
  console.log('[useDocuments] Buscando contratos...')

  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useDocuments] Erro ao buscar contratos:', error)
    // Não throw, apenas retorna vazio se tabela não existir
    return []
  }

  console.log('[useDocuments] Contratos encontrados:', data?.length || 0)

  // Converte contratos (colunas em portugues) para Document (campos em ingles)
  return (data || []).map((contrato: Record<string, unknown>) => ({
    id: contrato.id as string,
    type: 'contract' as const,
    title: `Contrato - ${contrato.servico_nome || 'Sem título'} (${contrato.cliente_nome || 'Cliente'})`,
    client_name: (contrato.cliente_nome as string) || '',
    client_email: contrato.cliente_email as string | undefined,
    client_phone: contrato.cliente_telefone as string | undefined,
    client_document: contrato.cliente_documento as string | undefined,
    client_address: contrato.cliente_endereco as string | undefined,
    value: (contrato.valor as number) || 0,
    status: (contrato.status as ContractStatus) || 'rascunho',
    created_at: (contrato.created_at as string) || new Date().toISOString(),
    updated_at: (contrato.updated_at as string) || new Date().toISOString(),
    service_name: contrato.servico_nome as string | undefined,
    service: contrato.servico_nome as string | undefined, // Alias para compatibilidade
    scope: contrato.servico_escopo as string | undefined, // Alias para compatibilidade
    deliverables: contrato.entregas as string | undefined,
    deadline_mode: contrato.prazo_modo as 'days' | 'date' | undefined,
    deadline_days: contrato.prazo_dias as number | undefined,
    deadline_type: contrato.prazo_tipo as 'dias-uteis' | 'dias-corridos' | undefined,
    deadline_date: contrato.prazo_data as string | undefined,
    payment_type: contrato.pagamento_tipo as string | undefined,
    payment_notes: contrato.pagamento_observacoes as string | undefined,
    proposal_id: contrato.proposta_id as string | undefined,
    contract_text: contrato.texto_contrato as string | undefined,
  }))
}

// Fetch principal - combina propostas e contratos
async function fetchDocuments(): Promise<Document[]> {
  try {
    const [propostas, contratos] = await Promise.all([
      fetchPropostas(),
      fetchContratos(),
    ])

    const propostaDocs = propostas.map(propostaToDocument)
    const allDocs = [...propostaDocs, ...contratos]

    // Ordena por data de criação
    return allDocs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (error) {
    console.error('[useDocuments] Erro ao buscar documentos:', error)
    throw error
  }
}

// Hook principal para listar documentos
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

// Atualizar status da proposta
async function updateProposalStatus(id: string, status: ProposalStatus): Promise<void> {
  const { error } = await supabase
    .from('propostas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// Atualizar status do contrato (tabela: contratos)
async function updateContractStatus(id: string, status: ContractStatus): Promise<void> {
  const { error } = await supabase
    .from('contratos')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// Hook para atualizar status
export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, type, status }: { id: string; type: 'proposal' | 'contract'; status: string }) => {
      if (type === 'proposal') {
        await updateProposalStatus(id, status as ProposalStatus)
      } else {
        await updateContractStatus(id, status as ContractStatus)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Atualizar follow-up da proposta
async function updateProposalFollowup(
  id: string,
  followup_data?: string,
  followup_canal?: string
): Promise<void> {
  const { error } = await supabase
    .from('propostas')
    .update({
      followup_data: followup_data || null,
      followup_canal: followup_canal || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

// Hook para atualizar follow-up
export function useUpdateFollowup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, followup_date, followup_channel }: {
      id: string
      followup_date?: string
      followup_channel?: string
    }) => {
      await updateProposalFollowup(id, followup_date, followup_channel)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
    },
  })
}

// Duplicar proposta
async function duplicateProposal(id: string): Promise<PropostaDB> {
  const { data: original, error: fetchError } = await supabase
    .from('propostas')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const newProposal = {
    freelancer_id: original.freelancer_id,
    cliente_nome: original.cliente_nome,
    cliente_email: original.cliente_email,
    cliente_telefone: original.cliente_telefone,
    servico: original.servico,
    escopo: original.escopo,
    prazo: original.prazo,
    valor: original.valor,
    forma_pagamento: original.forma_pagamento,
    status: 'rascunho' as ProposalStatus,
    followup_data: null,
    followup_canal: null,
    observacoes: original.observacoes,
  }

  const { data, error } = await supabase
    .from('propostas')
    .insert(newProposal)
    .select()
    .single()

  if (error) throw error
  return data as PropostaDB
}

// Duplicar contrato
async function duplicateContract(id: string): Promise<Record<string, unknown>> {
  const { data: original, error: fetchError } = await supabase
    .from('contratos')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Copia todos os campos exceto id, timestamps e proposta_id
  const newContract = {
    freelancer_id: original.freelancer_id,
    cliente_id: original.cliente_id,
    tipo_pessoa: original.tipo_pessoa,
    cliente_nome: original.cliente_nome,
    cliente_documento: original.cliente_documento,
    cliente_rg: original.cliente_rg,
    cliente_razao_social: original.cliente_razao_social,
    cliente_endereco: original.cliente_endereco,
    cliente_cidade: original.cliente_cidade,
    cliente_estado: original.cliente_estado,
    cliente_telefone: original.cliente_telefone,
    cliente_email: original.cliente_email,
    servico_nome: original.servico_nome,
    servico_escopo: original.servico_escopo,
    entregas: original.entregas,
    valor: original.valor,
    prazo_modo: original.prazo_modo,
    prazo_dias: original.prazo_dias,
    prazo_tipo: original.prazo_tipo,
    prazo_data: original.prazo_data,
    pagamento_tipo: original.pagamento_tipo,
    pagamento_parcelas: original.pagamento_parcelas,
    pagamento_observacoes: original.pagamento_observacoes,
    texto_contrato: original.texto_contrato,
    status: 'rascunho' as ContractStatus, // Sempre começa como rascunho
    // proposta_id não é copiado (não vincula à proposta original)
  }

  const { data, error } = await supabase
    .from('contratos')
    .insert(newContract)
    .select()
    .single()

  if (error) throw error
  return data as Record<string, unknown>
}

// Hook para duplicar documento
export function useDuplicateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'proposal' | 'contract' }) => {
      if (type === 'proposal') {
        return await duplicateProposal(id)
      }
      return await duplicateContract(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Excluir proposta
async function deleteProposal(id: string): Promise<void> {
  const { error } = await supabase
    .from('propostas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Excluir contrato (tabela: contratos)
async function deleteContract(id: string): Promise<void> {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Hook para excluir documento
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'proposal' | 'contract' }) => {
      if (type === 'proposal') {
        await deleteProposal(id)
      } else {
        await deleteContract(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Buscar proposta por ID
export async function getProposalById(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('propostas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return propostaToDocument(data as PropostaDB)
}
