import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { DashboardMetrics, FinancialRecord, ProposalStatus, ContractStatus } from '@/types'

// Tipo interno para proposta do banco (colunas em português)
interface PropostaDB {
  id: string
  freelancer_id: string
  cliente_nome: string
  valor: number
  status: ProposalStatus
  created_at: string
}

// Tipo interno para contrato do banco (colunas em português)
interface ContratoSimples {
  id: string
  valor: number
  status: ContractStatus
}

// Tipo interno para registro financeiro do banco (colunas em português)
interface RegistroFinanceiroDB {
  id: string
  freelancer_id: string
  contrato_id?: string
  descricao: string
  valor: number
  data_vencimento?: string
  data_recebimento?: string
  recebido: boolean
  observacoes?: string
  created_at: string
}

// Converter registro do banco para FinancialRecord
function toFinancialRecord(record: RegistroFinanceiroDB): FinancialRecord {
  return {
    id: record.id,
    user_id: record.freelancer_id,
    contract_id: record.contrato_id,
    description: record.descricao,
    amount: record.valor,
    due_date: record.data_vencimento,
    received_date: record.data_recebimento,
    is_received: record.recebido,
    notes: record.observacoes,
    created_at: record.created_at,
  }
}

// Chaves para localStorage (fallback)
const STORAGE_KEYS = {
  proposals: 'kitfreela_proposals',
  contracts: 'kitfreela_contracts',
  financial: 'kitfreela_financial',
}

// Helper para ler do localStorage
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Função para calcular métricas a partir dos dados
function calculateMetrics(
  propostas: PropostaDB[],
  contratos: ContratoSimples[],
  financial: FinancialRecord[]
): DashboardMetrics {
  // Propostas por status
  const pipelineRascunho = propostas.filter(p => p.status === 'rascunho').length
  const pipelineEnviada = propostas.filter(p => p.status === 'enviada').length
  const pipelineAceita = propostas.filter(p => p.status === 'aceita').length
  const pipelineEncerrada = propostas.filter(p => p.status === 'encerrada').length
  const pipelineExpirada = propostas.filter(p => p.status === 'expirada').length

  // Métricas principais de propostas
  const proposalsEnviadas = pipelineEnviada + pipelineAceita + pipelineEncerrada + pipelineExpirada
  const proposalsAceitas = pipelineAceita + pipelineEncerrada
  const proposalsAceitasPercent = proposalsEnviadas > 0
    ? Math.round((proposalsAceitas / proposalsEnviadas) * 100)
    : 0
  const proposalsEncerradas = pipelineEncerrada

  // Valores de propostas (usando 'valor' da tabela)
  const totalProposto = propostas.reduce((sum, p) => sum + (p.valor || 0), 0)
  const totalFechado = propostas
    .filter(p => p.status === 'aceita' || p.status === 'encerrada')
    .reduce((sum, p) => sum + (p.valor || 0), 0)
  const taxaFechamento = totalProposto > 0
    ? Math.round((totalFechado / totalProposto) * 100)
    : 0

  // Contratos por status (usando 'valor' da tabela contratos)
  const contratosCriados = contratos.length
  const contratosAtivos = contratos.filter(c => c.status === 'ativo').length
  const contratosFinalizados = contratos.filter(c => c.status === 'finalizado').length
  const valorContratos = contratos.reduce((sum, c) => sum + (c.valor || 0), 0)

  // Financeiro
  // jaRecebido = soma dos pagamentos registrados como recebidos
  const jaRecebido = financial
    .filter(f => f.is_received)
    .reduce((sum, f) => sum + (f.amount || 0), 0)
  // aReceber = valor total dos contratos - valor ja recebido
  const aReceber = Math.max(0, valorContratos - jaRecebido)

  return {
    proposalsEnviadas,
    proposalsAceitas,
    proposalsAceitasPercent,
    proposalsEncerradas,
    totalProposto,
    totalFechado,
    taxaFechamento,
    pipelineRascunho,
    pipelineEnviada,
    pipelineAceita,
    pipelineEncerrada,
    pipelineExpirada,
    contratosCriados,
    contratosAtivos,
    contratosFinalizados,
    jaRecebido,
    aReceber,
    valorContratos,
    totalPropostas: propostas.length,
    totalContratos: contratos.length,
  }
}

// Buscar dados do Supabase (tabelas em português)
async function fetchFromSupabase(): Promise<{
  propostas: PropostaDB[]
  contratos: ContratoSimples[]
  financial: FinancialRecord[]
}> {
  const [propostasRes, contratosRes, financialRes] = await Promise.all([
    supabase.from('propostas').select('id, freelancer_id, cliente_nome, valor, status, created_at'),
    supabase.from('contratos').select('id, valor, status'),
    supabase.from('registros_financeiros').select('*'),
  ])

  // Converter registros financeiros do formato do banco para FinancialRecord
  const financialData = (financialRes.data as RegistroFinanceiroDB[]) || []
  const financial = financialData.map(toFinancialRecord)

  return {
    propostas: (propostasRes.data as PropostaDB[]) || [],
    contratos: (contratosRes.data as ContratoSimples[]) || [],
    financial,
  }
}

// Converter proposta do localStorage (formato antigo) para PropostaDB
function convertLocalProposal(p: Record<string, unknown>): PropostaDB {
  return {
    id: (p.id as string) || '',
    freelancer_id: (p.freelancer_id as string) || (p.user_id as string) || '',
    cliente_nome: (p.cliente_nome as string) || (p.client_name as string) || '',
    valor: (p.valor as number) || (p.value as number) || 0,
    status: (p.status as ProposalStatus) || 'rascunho',
    created_at: (p.created_at as string) || new Date().toISOString(),
  }
}

// Buscar dados do localStorage (fallback)
function fetchFromLocalStorage(): {
  propostas: PropostaDB[]
  contratos: ContratoSimples[]
  financial: FinancialRecord[]
} {
  const rawProposals = getFromStorage<Record<string, unknown>>(STORAGE_KEYS.proposals)
  const rawContracts = getFromStorage<Record<string, unknown>>(STORAGE_KEYS.contracts)

  // Converter contratos do localStorage para formato simples
  const contratos: ContratoSimples[] = rawContracts.map(c => ({
    id: (c.id as string) || '',
    valor: (c.valor as number) || (c.value as number) || 0,
    status: (c.status as ContractStatus) || 'rascunho',
  }))

  return {
    propostas: rawProposals.map(convertLocalProposal),
    contratos,
    financial: getFromStorage<FinancialRecord>(STORAGE_KEYS.financial),
  }
}

// Função principal de fetch
async function fetchDashboardData(): Promise<DashboardMetrics> {
  let data: {
    propostas: PropostaDB[]
    contratos: ContratoSimples[]
    financial: FinancialRecord[]
  }

  if (isSupabaseConfigured()) {
    try {
      data = await fetchFromSupabase()
    } catch (error) {
      console.warn('Erro ao buscar do Supabase, usando localStorage:', error)
      data = fetchFromLocalStorage()
    }
  } else {
    data = fetchFromLocalStorage()
  }

  return calculateMetrics(data.propostas, data.contratos, data.financial)
}

// Hook principal
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

// Métricas vazias (estado inicial)
export const emptyMetrics: DashboardMetrics = {
  proposalsEnviadas: 0,
  proposalsAceitas: 0,
  proposalsAceitasPercent: 0,
  proposalsEncerradas: 0,
  totalProposto: 0,
  totalFechado: 0,
  taxaFechamento: 0,
  pipelineRascunho: 0,
  pipelineEnviada: 0,
  pipelineAceita: 0,
  pipelineEncerrada: 0,
  pipelineExpirada: 0,
  contratosCriados: 0,
  contratosAtivos: 0,
  contratosFinalizados: 0,
  jaRecebido: 0,
  aReceber: 0,
  valorContratos: 0,
  totalPropostas: 0,
  totalContratos: 0,
}
