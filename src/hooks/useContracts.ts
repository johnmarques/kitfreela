import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Contract, ContractStatus } from '@/types'

// Chaves para localStorage (fallback)
const STORAGE_KEY = 'kitfreela_contracts'

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
async function fetchFromSupabase(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Contract[]) || []
}

// Fetch principal
async function fetchContracts(): Promise<Contract[]> {
  if (isSupabaseConfigured()) {
    try {
      return await fetchFromSupabase()
    } catch (error) {
      console.warn('Erro ao buscar do Supabase, usando localStorage:', error)
      return getFromStorage()
    }
  }
  return getFromStorage()
}

// Hook para listar contratos
export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
    staleTime: 1000 * 60 * 2,
  })
}

// Buscar contrato por ID
export async function getContractById(id: string): Promise<Contract | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Contract
  } else {
    const contracts = getFromStorage()
    return contracts.find(c => c.id === id) || null
  }
}

// Tipo para criar/atualizar contrato (sem id, created_at, updated_at)
export type ContractInput = Omit<Contract, 'id' | 'created_at' | 'updated_at'>

// Criar contrato
async function createContract(input: ContractInput): Promise<Contract> {
  const now = new Date().toISOString()

  if (isSupabaseConfigured()) {
    // Para Supabase: NÃO enviar id, created_at, updated_at
    // O banco gera UUID automaticamente e timestamps via DEFAULT
    console.log('[useContracts] Criando contrato no Supabase...')
    console.log('[useContracts] Dados:', JSON.stringify(input, null, 2))

    const { data, error } = await supabase
      .from('contracts')
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error('[useContracts] Erro ao criar contrato:', error)
      throw error
    }

    console.log('[useContracts] Contrato criado com sucesso:', data?.id)
    return data as Contract
  } else {
    // Fallback localStorage: gera ID manualmente
    const newContract: Contract = {
      ...input,
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
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Atualizar contrato
async function updateContract(id: string, input: Partial<ContractInput>): Promise<Contract> {
  const now = new Date().toISOString()

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('contracts')
      .update({ ...input, updated_at: now })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Contract
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
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
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
          .from('contracts')
          .update({ status, updated_at: now })
          .eq('id', id)

        if (error) throw error
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
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Deletar contrato
async function deleteContract(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (error) throw error
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
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
