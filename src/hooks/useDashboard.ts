import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { DashboardMetrics, Contract, FinancialRecord, ProposalStatus } from '@/types'

// Tipo interno para proposta do banco (colunas em português)
interface PropostaDB {
  id: string
  freelancer_id: string
  cliente_nome: string
  valor: number
  status: ProposalStatus
  created_at: string
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
  contracts: Contract[],
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

  // Contratos por status
  const contratosCriados = contracts.length
  const contratosAtivos = contracts.filter(c => c.status === 'ativo').length
  const contratosFinalizados = contracts.filter(c => c.status === 'finalizado').length

  // Financeiro
  const jaRecebido = financial
    .filter(f => f.is_received)
    .reduce((sum, f) => sum + (f.amount || 0), 0)
  const aReceber = financial
    .filter(f => !f.is_received)
    .reduce((sum, f) => sum + (f.amount || 0), 0)
  const valorContratos = contracts.reduce((sum, c) => sum + (c.value || 0), 0)

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
    totalContratos: contracts.length,
  }
}

// Buscar dados do Supabase
async function fetchFromSupabase(): Promise<{
  propostas: PropostaDB[]
  contracts: Contract[]
  financial: FinancialRecord[]
}> {
  const [propostasRes, contractsRes, financialRes] = await Promise.all([
    supabase.from('propostas').select('id, freelancer_id, cliente_nome, valor, status, created_at'),
    supabase.from('contracts').select('*'),
    supabase.from('financial_records').select('*'),
  ])

  return {
    propostas: (propostasRes.data as PropostaDB[]) || [],
    contracts: (contractsRes.data as Contract[]) || [],
    financial: (financialRes.data as FinancialRecord[]) || [],
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
  contracts: Contract[]
  financial: FinancialRecord[]
} {
  const rawProposals = getFromStorage<Record<string, unknown>>(STORAGE_KEYS.proposals)
  return {
    propostas: rawProposals.map(convertLocalProposal),
    contracts: getFromStorage<Contract>(STORAGE_KEYS.contracts),
    financial: getFromStorage<FinancialRecord>(STORAGE_KEYS.financial),
  }
}

// Função principal de fetch
async function fetchDashboardData(): Promise<DashboardMetrics> {
  let data: {
    propostas: PropostaDB[]
    contracts: Contract[]
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

  return calculateMetrics(data.propostas, data.contracts, data.financial)
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
