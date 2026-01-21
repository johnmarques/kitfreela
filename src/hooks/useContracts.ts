import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Contract, ContractStatus } from '@/types'

// ============================================================
// HOOK PARA GERENCIAMENTO DE CONTRATOS
// ============================================================
// Tabela: contratos (PORTUGUES)
// O hook mapeia os campos do frontend (ingles) para o banco (portugues)
// ============================================================

// Chaves para localStorage (fallback)
const STORAGE_KEY = 'kitfreela_contracts'

// Tipo do contrato no banco (colunas em portugues)
interface ContratoRecord {
  id: string
  freelancer_id: string
  proposta_id?: string
  cliente_id?: string
  tipo_pessoa: 'pf' | 'pj'
  cliente_nome: string
  cliente_documento?: string
  cliente_rg?: string
  cliente_razao_social?: string
  cliente_endereco?: string
  cliente_cidade?: string
  cliente_estado?: string
  cliente_telefone?: string
  cliente_email?: string
  servico_nome: string
  servico_escopo?: string
  entregas?: string
  valor: number
  prazo_modo: 'days' | 'date'
  prazo_dias?: number
  prazo_tipo?: string
  prazo_data?: string
  pagamento_tipo: string
  pagamento_parcelas?: unknown
  pagamento_observacoes?: string
  status: ContractStatus
  texto_contrato?: string
  data_inicio?: string
  data_fim?: string
  created_at: string
  updated_at: string
}

// Mapeia Contract (frontend/ingles) para ContratoRecord (banco/portugues)
function toContratoRecord(contract: Partial<Contract>, freelancerId: string): Partial<ContratoRecord> {
  return {
    freelancer_id: freelancerId,
    proposta_id: contract.proposal_id,
    cliente_id: contract.client_id,
    tipo_pessoa: contract.person_type as 'pf' | 'pj',
    cliente_nome: contract.client_name,
    cliente_documento: contract.client_document,
    cliente_rg: contract.client_rg,
    cliente_razao_social: contract.client_company_name,
    cliente_endereco: contract.client_address,
    cliente_cidade: contract.client_city,
    cliente_estado: contract.client_state,
    cliente_telefone: contract.client_phone,
    cliente_email: contract.client_email,
    servico_nome: contract.service_name,
    servico_escopo: contract.service_scope,
    entregas: contract.deliverables,
    valor: contract.value,
    prazo_modo: contract.deadline_mode as 'days' | 'date',
    prazo_dias: contract.deadline_days,
    prazo_tipo: contract.deadline_type,
    prazo_data: contract.deadline_date,
    pagamento_tipo: contract.payment_type,
    pagamento_parcelas: contract.payment_installments,
    pagamento_observacoes: contract.payment_notes,
    status: contract.status,
    texto_contrato: contract.contract_text,
  }
}

// Mapeia ContratoRecord (banco/portugues) para Contract (frontend/ingles)
function toContract(record: ContratoRecord): Contract {
  return {
    id: record.id,
    user_id: record.freelancer_id, // Mapeado para compatibilidade
    proposal_id: record.proposta_id,
    client_id: record.cliente_id,
    person_type: record.tipo_pessoa,
    client_name: record.cliente_nome,
    client_document: record.cliente_documento,
    client_rg: record.cliente_rg,
    client_company_name: record.cliente_razao_social,
    client_address: record.cliente_endereco,
    client_city: record.cliente_cidade,
    client_state: record.cliente_estado,
    client_phone: record.cliente_telefone,
    client_email: record.cliente_email,
    service_name: record.servico_nome,
    service_scope: record.servico_escopo,
    deliverables: record.entregas,
    value: record.valor,
    deadline_mode: record.prazo_modo,
    deadline_days: record.prazo_dias,
    deadline_type: record.prazo_tipo as 'dias-uteis' | 'dias-corridos' | undefined,
    deadline_date: record.prazo_data,
    payment_type: record.pagamento_tipo as Contract['payment_type'],
    payment_installments: record.pagamento_parcelas as Contract['payment_installments'],
    payment_notes: record.pagamento_observacoes,
    status: record.status,
    contract_text: record.texto_contrato,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

// Helper para ler do localStorage
function getFromStorage(): Contract[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Helper para salvar no localStorage
function saveToStorage(data: Contract[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Helper para gerar ID unico
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Buscar contratos do Supabase
async function fetchFromSupabase(freelancerId?: string): Promise<Contract[]> {
  let query = supabase
    .from('contratos')
    .select('*')
    .order('created_at', { ascending: false })

  if (freelancerId) {
    query = query.eq('freelancer_id', freelancerId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[useContracts] Erro ao buscar contratos:', error)
    throw error
  }

  return (data as ContratoRecord[])?.map(toContract) || []
}

// Fetch principal
async function fetchContracts(freelancerId?: string): Promise<Contract[]> {
  if (isSupabaseConfigured()) {
    try {
      return await fetchFromSupabase(freelancerId)
    } catch (error) {
      console.warn('[useContracts] Erro ao buscar do Supabase, usando localStorage:', error)
      return getFromStorage()
    }
  }
  return getFromStorage()
}

// Hook para listar contratos
export function useContracts(freelancerId?: string) {
  return useQuery({
    queryKey: ['contratos', freelancerId],
    queryFn: () => fetchContracts(freelancerId),
    staleTime: 1000 * 60 * 2,
  })
}

// Buscar contrato por ID
export async function getContractById(id: string): Promise<Contract | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[useContracts] Erro ao buscar contrato por ID:', error)
      return null
    }
    return toContract(data as ContratoRecord)
  } else {
    const contracts = getFromStorage()
    return contracts.find(c => c.id === id) || null
  }
}

// Tipo para criar/atualizar contrato (sem id, created_at, updated_at)
export type ContractInput = Omit<Contract, 'id' | 'created_at' | 'updated_at'>

// Interface para criacao que inclui freelancerId
interface CreateContractParams {
  freelancerId: string
  data: ContractInput
}

// Criar contrato
async function createContract({ freelancerId, data }: CreateContractParams): Promise<Contract> {
  const now = new Date().toISOString()

  if (isSupabaseConfigured()) {
    console.log('[useContracts] Criando contrato no Supabase...')

    // Converte para formato do banco (portugues)
    const contratoData = toContratoRecord(data, freelancerId)

    // Remove campos undefined
    const cleanData = Object.fromEntries(
      Object.entries(contratoData).filter(([, v]) => v !== undefined)
    )

    console.log('[useContracts] Dados para inserir:', JSON.stringify(cleanData, null, 2))

    const { data: result, error } = await supabase
      .from('contratos')
      .insert(cleanData)
      .select()
      .single()

    if (error) {
      console.error('[useContracts] Erro ao criar contrato:', error)
      throw error
    }

    console.log('[useContracts] Contrato criado com sucesso:', result?.id)
    return toContract(result as ContratoRecord)
  } else {
    // Fallback localStorage
    const newContract: Contract = {
      ...data,
      id: generateId(),
      created_at: now,
      updated_at: now,
    }
    const contracts = getFromStorage()
    contracts.unshift(newContract)
    saveToStorage(contracts)
    return newContract
  }
}

// Hook para criar contrato
export function useCreateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

// Atualizar contrato
async function updateContract(
  id: string,
  input: Partial<ContractInput>,
  freelancerId?: string
): Promise<Contract> {
  const now = new Date().toISOString()

  if (isSupabaseConfigured()) {
    // Converte para formato do banco
    const contratoData = toContratoRecord(input, freelancerId || '')

    // Remove campos undefined e freelancer_id se nao informado
    const cleanData = Object.fromEntries(
      Object.entries({
        ...contratoData,
        updated_at: now,
      }).filter(([k, v]) => v !== undefined && (k !== 'freelancer_id' || freelancerId))
    )

    const { data, error } = await supabase
      .from('contratos')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[useContracts] Erro ao atualizar contrato:', error)
      throw error
    }
    return toContract(data as ContratoRecord)
  } else {
    const contracts = getFromStorage()
    const index = contracts.findIndex(c => c.id === id)

    if (index === -1) throw new Error('Contrato nao encontrado')

    contracts[index] = {
      ...contracts[index],
      ...input,
      updated_at: now,
    }

    saveToStorage(contracts)
    return contracts[index]
  }
}

// Hook para atualizar contrato
export function useUpdateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractInput> }) =>
      updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Atualizar apenas status
export function useUpdateContractStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContractStatus }) => {
      const now = new Date().toISOString()

      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('contratos')
          .update({ status, updated_at: now })
          .eq('id', id)

        if (error) {
          console.error('[useContracts] Erro ao atualizar status:', error)
          throw error
        }
      } else {
        const contracts = getFromStorage()
        const index = contracts.findIndex(c => c.id === id)

        if (index !== -1) {
          contracts[index].status = status
          contracts[index].updated_at = now
          saveToStorage(contracts)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Deletar contrato
async function deleteContract(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[useContracts] Erro ao deletar contrato:', error)
      throw error
    }
  } else {
    const contracts = getFromStorage()
    const filtered = contracts.filter(c => c.id !== id)
    saveToStorage(filtered)
  }
}

// Hook para deletar contrato
export function useDeleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
