import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PersonType } from '@/types'

// ============================================================
// HOOK PARA GERENCIAMENTO DE CLIENTES
// ============================================================
// Tabela: clientes (PORTUGUES)
// Colunas: nome, email, telefone, tipo_pessoa, cpf, cnpj, rg,
//          razao_social, endereco, cidade, estado, observacoes
// ============================================================
// Clientes sao criados AUTOMATICAMENTE a partir de propostas e contratos.
// Nao existe cadastro manual de clientes.
// A deduplicacao e feita por email ou documento (CPF/CNPJ).
// ============================================================

// Tipo do cliente no banco (colunas em portugues)
export interface Cliente {
  id: string
  freelancer_id: string
  nome: string
  email?: string
  telefone?: string
  tipo_pessoa: PersonType
  cpf?: string
  cnpj?: string
  rg?: string
  razao_social?: string
  endereco?: string
  cidade?: string
  estado?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

// Tipo para criacao de cliente (sem id e timestamps)
export interface ClienteInput {
  freelancer_id: string
  nome: string
  email?: string
  telefone?: string
  tipo_pessoa?: PersonType
  cpf?: string
  cnpj?: string
  rg?: string
  razao_social?: string
  endereco?: string
  cidade?: string
  estado?: string
  observacoes?: string
}

// Cliente com metricas agregadas (para listagem)
export interface ClienteWithMetrics extends Cliente {
  proposals_count: number
  contracts_count: number
  last_interaction: string | null
  total_proposals_value: number
  total_contracts_value: number
}

// Alias para compatibilidade com codigo existente
export type Client = Cliente
export type ClientInput = ClienteInput
export type ClientWithMetrics = ClienteWithMetrics

// ============================================================
// FUNCAO: findOrCreateClient
// ============================================================
// Busca um cliente existente pelo email ou documento.
// Se nao existir, cria um novo.
// Retorna o ID do cliente (existente ou criado).
// ============================================================

export async function findOrCreateClient(input: ClienteInput): Promise<string | null> {
  console.log('[useClients] findOrCreateClient chamado:', input.nome)

  try {
    // 1. Primeiro, tentar encontrar cliente existente
    const existingClient = await findExistingClient(
      input.freelancer_id,
      input.email,
      input.cpf,
      input.cnpj
    )

    if (existingClient) {
      console.log('[useClients] Cliente existente encontrado:', existingClient.id)

      // Atualizar dados do cliente se houver informacoes novas
      await updateClientIfNeeded(existingClient, input)

      return existingClient.id
    }

    // 2. Se nao existe, criar novo cliente
    console.log('[useClients] Criando novo cliente...')

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        freelancer_id: input.freelancer_id,
        nome: input.nome,
        email: input.email || null,
        telefone: input.telefone || null,
        tipo_pessoa: input.tipo_pessoa || 'pf',
        cpf: input.cpf || null,
        cnpj: input.cnpj || null,
        rg: input.rg || null,
        razao_social: input.razao_social || null,
        endereco: input.endereco || null,
        cidade: input.cidade || null,
        estado: input.estado || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[useClients] Erro ao criar cliente:', error)
      return null
    }

    console.log('[useClients] Novo cliente criado:', data.id)
    return data.id
  } catch (err) {
    console.error('[useClients] Erro inesperado:', err)
    return null
  }
}

// ============================================================
// FUNCAO: findExistingClient
// ============================================================
// Busca cliente existente por email ou documento (CPF/CNPJ).
// A busca e feita apenas dentro do freelancer_id informado.
// ============================================================

async function findExistingClient(
  freelancerId: string,
  email?: string,
  cpf?: string,
  cnpj?: string
): Promise<Cliente | null> {
  // Se nao tem nenhum identificador, nao pode buscar
  if (!email && !cpf && !cnpj) {
    console.log('[useClients] Nenhum identificador para busca (email/cpf/cnpj)')
    return null
  }

  // Buscar por email primeiro (mais comum)
  if (email) {
    const { data: byEmail } = await supabase
      .from('clientes')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .eq('email', email)
      .single()

    if (byEmail) {
      console.log('[useClients] Cliente encontrado por email:', email)
      return byEmail as Cliente
    }
  }

  // Buscar por CPF
  if (cpf) {
    const { data: byCpf } = await supabase
      .from('clientes')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .eq('cpf', cpf)
      .single()

    if (byCpf) {
      console.log('[useClients] Cliente encontrado por CPF:', cpf)
      return byCpf as Cliente
    }
  }

  // Buscar por CNPJ
  if (cnpj) {
    const { data: byCnpj } = await supabase
      .from('clientes')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .eq('cnpj', cnpj)
      .single()

    if (byCnpj) {
      console.log('[useClients] Cliente encontrado por CNPJ:', cnpj)
      return byCnpj as Cliente
    }
  }

  return null
}

// ============================================================
// FUNCAO: updateClientIfNeeded
// ============================================================
// Atualiza dados do cliente se houver informacoes novas
// que ainda nao estavam cadastradas.
// ============================================================

async function updateClientIfNeeded(
  existing: Cliente,
  input: ClienteInput
): Promise<void> {
  const updates: Partial<Cliente> = {}

  // Atualizar campos que estao vazios no existente mas tem valor no input
  if (!existing.telefone && input.telefone) updates.telefone = input.telefone
  if (!existing.cpf && input.cpf) updates.cpf = input.cpf
  if (!existing.cnpj && input.cnpj) updates.cnpj = input.cnpj
  if (!existing.rg && input.rg) updates.rg = input.rg
  if (!existing.razao_social && input.razao_social) updates.razao_social = input.razao_social
  if (!existing.endereco && input.endereco) updates.endereco = input.endereco
  if (!existing.cidade && input.cidade) updates.cidade = input.cidade
  if (!existing.estado && input.estado) updates.estado = input.estado

  // Atualizar tipo_pessoa se foi informado e e diferente do existente
  // Isso corrige o bug onde o tipo sempre ficava como 'pf'
  if (input.tipo_pessoa && input.tipo_pessoa !== existing.tipo_pessoa) {
    updates.tipo_pessoa = input.tipo_pessoa
  }

  // Se nao ha nada para atualizar, retorna
  if (Object.keys(updates).length === 0) {
    return
  }

  console.log('[useClients] Atualizando cliente com novos dados:', updates)

  const { error } = await supabase
    .from('clientes')
    .update(updates)
    .eq('id', existing.id)

  if (error) {
    console.error('[useClients] Erro ao atualizar cliente:', error)
  }
}

// ============================================================
// HOOK: useClients
// ============================================================
// Lista todos os clientes do freelancer com metricas agregadas.
// Metricas: quantidade de propostas, contratos e ultima interacao.
// ============================================================

export function useClients(freelancerId: string | null) {
  return useQuery({
    queryKey: ['clientes', freelancerId],
    queryFn: async (): Promise<ClienteWithMetrics[]> => {
      if (!freelancerId) return []

      console.log('[useClients] Buscando clientes para freelancer:', freelancerId)

      // Buscar clientes basicos
      const { data: clientes, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('nome', { ascending: true })

      if (error) {
        console.error('[useClients] Erro ao buscar clientes:', error)
        return []
      }

      if (!clientes || clientes.length === 0) {
        console.log('[useClients] Nenhum cliente encontrado')
        return []
      }

      // Buscar metricas para cada cliente
      const clientesWithMetrics = await Promise.all(
        clientes.map(async (cliente) => {
          const metrics = await getClientMetrics(cliente.id)
          return {
            ...cliente,
            ...metrics,
          } as ClienteWithMetrics
        })
      )

      console.log('[useClients] Clientes encontrados:', clientesWithMetrics.length)
      return clientesWithMetrics
    },
    enabled: !!freelancerId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

// ============================================================
// FUNCAO: getClientMetrics
// ============================================================
// Calcula metricas agregadas para um cliente especifico.
// ============================================================

async function getClientMetrics(clienteId: string): Promise<{
  proposals_count: number
  contracts_count: number
  last_interaction: string | null
  total_proposals_value: number
  total_contracts_value: number
}> {
  // Contar propostas (tabela propostas, coluna cliente_id)
  const { count: proposalsCount, data: proposalsData } = await supabase
    .from('propostas')
    .select('created_at, valor', { count: 'exact' })
    .eq('cliente_id', clienteId)

  // Contar contratos (tabela contratos, coluna cliente_id)
  const { count: contractsCount, data: contractsData } = await supabase
    .from('contratos')
    .select('created_at, valor', { count: 'exact' })
    .eq('cliente_id', clienteId)

  // Calcular ultima interacao
  let lastInteraction: string | null = null
  const allDates: string[] = []

  if (proposalsData) {
    allDates.push(...proposalsData.map((p) => p.created_at))
  }
  if (contractsData) {
    allDates.push(...contractsData.map((c) => c.created_at))
  }

  if (allDates.length > 0) {
    allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    lastInteraction = allDates[0]
  }

  // Calcular valores separados
  const totalProposalsValue = proposalsData
    ? proposalsData.reduce((sum, p) => sum + (p.valor || 0), 0)
    : 0
  const totalContractsValue = contractsData
    ? contractsData.reduce((sum, c) => sum + (c.valor || 0), 0)
    : 0

  return {
    proposals_count: proposalsCount || 0,
    contracts_count: contractsCount || 0,
    last_interaction: lastInteraction,
    total_proposals_value: totalProposalsValue,
    total_contracts_value: totalContractsValue,
  }
}

// ============================================================
// HOOK: useClientById
// ============================================================
// Busca um cliente especifico pelo ID.
// ============================================================

export function useClientById(clienteId: string | null) {
  return useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: async (): Promise<ClienteWithMetrics | null> => {
      if (!clienteId) return null

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single()

      if (error) {
        console.error('[useClients] Erro ao buscar cliente:', error)
        return null
      }

      const metrics = await getClientMetrics(clienteId)
      return { ...data, ...metrics } as ClienteWithMetrics
    },
    enabled: !!clienteId,
  })
}
