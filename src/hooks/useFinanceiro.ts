import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FinancialRecord, ContractStatus } from '@/types'

// ============================================================
// HOOK PARA GERENCIAMENTO FINANCEIRO
// ============================================================
// Tabela: registros_financeiros (PORTUGUES)
// Contratos: tabela contratos (PORTUGUES)
// ============================================================

// Tipo do registro financeiro no banco (colunas em portugues)
interface RegistroFinanceiroRecord {
  id: string
  freelancer_id: string
  contrato_id?: string
  descricao: string
  valor: number
  data_vencimento?: string
  data_recebimento?: string
  recebido: boolean
  forma_pagamento?: string
  observacoes?: string
  created_at: string
}

// Tipo simplificado do contrato para financeiro
export interface ContratoFinanceiro {
  id: string
  cliente_nome: string
  servico_nome: string
  valor: number
  status: ContractStatus
  created_at: string
}

// Resumo financeiro
export interface ResumoFinanceiro {
  totalAReceber: number
  totalRecebido: number
  totalFaturado: number
  totalContratos: number
  contratosAtivos: number
  clientesAtivos: number
  contratosEmDia: number
  contratosParciais: number
  contratosQuitados: number
  contratosAtrasados: number
}

// Mapeia registro do banco para FinancialRecord
function toFinancialRecord(record: RegistroFinanceiroRecord): FinancialRecord {
  return {
    id: record.id,
    user_id: record.freelancer_id,
    contract_id: record.contrato_id,
    description: record.descricao,
    amount: record.valor,
    due_date: record.data_vencimento,
    received_date: record.data_recebimento,
    is_received: record.recebido,
    payment_method: record.forma_pagamento as FinancialRecord['payment_method'],
    notes: record.observacoes,
    created_at: record.created_at,
  }
}


// ============================================================
// HOOK: useContratosFin (contratos para select)
// ============================================================
export function useContratosFin(freelancerId: string | null) {
  return useQuery({
    queryKey: ['contratos-financeiro', freelancerId],
    queryFn: async (): Promise<ContratoFinanceiro[]> => {
      if (!freelancerId) return []

      const { data, error } = await supabase
        .from('contratos')
        .select('id, cliente_nome, servico_nome, valor, status, created_at')
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[useFinanceiro] Erro ao buscar contratos:', error)
        return []
      }

      return (data || []) as ContratoFinanceiro[]
    },
    enabled: !!freelancerId,
    staleTime: 1000 * 60 * 2,
  })
}

// ============================================================
// HOOK: useRegistrosFinanceiros
// ============================================================
export function useRegistrosFinanceiros(freelancerId: string | null) {
  return useQuery({
    queryKey: ['registros-financeiros', freelancerId],
    queryFn: async (): Promise<FinancialRecord[]> => {
      if (!freelancerId) return []

      const { data, error } = await supabase
        .from('registros_financeiros')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[useFinanceiro] Erro ao buscar registros:', error)
        return []
      }

      return (data || []).map((r) => toFinancialRecord(r as RegistroFinanceiroRecord))
    },
    enabled: !!freelancerId,
    staleTime: 1000 * 60 * 2,
  })
}

// ============================================================
// HOOK: useResumoFinanceiro
// ============================================================
export function useResumoFinanceiro(freelancerId: string | null) {
  return useQuery({
    queryKey: ['resumo-financeiro', freelancerId],
    queryFn: async (): Promise<ResumoFinanceiro> => {
      const emptyResumo: ResumoFinanceiro = {
        totalAReceber: 0,
        totalRecebido: 0,
        totalFaturado: 0,
        totalContratos: 0,
        contratosAtivos: 0,
        clientesAtivos: 0,
        contratosEmDia: 0,
        contratosParciais: 0,
        contratosQuitados: 0,
        contratosAtrasados: 0,
      }

      if (!freelancerId) return emptyResumo

      // Buscar contratos
      const { data: contratos, error: contratosErr } = await supabase
        .from('contratos')
        .select('id, cliente_nome, valor, status')
        .eq('freelancer_id', freelancerId)

      if (contratosErr) {
        console.error('[useFinanceiro] Erro ao buscar contratos:', contratosErr)
        return emptyResumo
      }

      // Buscar registros financeiros
      const { data: registros, error: registrosErr } = await supabase
        .from('registros_financeiros')
        .select('*')
        .eq('freelancer_id', freelancerId)

      if (registrosErr) {
        console.error('[useFinanceiro] Erro ao buscar registros:', registrosErr)
      }

      const contratosData = contratos || []
      const registrosData = (registros || []) as RegistroFinanceiroRecord[]

      // Calcular totais
      const totalFaturado = contratosData.reduce((sum, c) => sum + (c.valor || 0), 0)
      const totalRecebido = registrosData
        .filter((r) => r.recebido)
        .reduce((sum, r) => sum + (r.valor || 0), 0)
      const totalAReceber = totalFaturado - totalRecebido

      // Contratos por status
      const contratosAtivos = contratosData.filter((c) => c.status === 'ativo').length

      // Clientes unicos com contratos ativos
      const clientesAtivos = new Set(
        contratosData.filter((c) => c.status === 'ativo').map((c) => c.cliente_nome)
      ).size

      // Calcular situacao financeira dos contratos
      let emDia = 0
      let parciais = 0
      let quitados = 0
      let atrasados = 0

      for (const contrato of contratosData) {
        const pagamentosContrato = registrosData.filter(
          (r) => r.contrato_id === contrato.id && r.recebido
        )
        const totalPago = pagamentosContrato.reduce((sum, r) => sum + r.valor, 0)
        const valorContrato = contrato.valor || 0

        if (totalPago >= valorContrato) {
          quitados++
        } else if (totalPago > 0) {
          parciais++
        } else if (contrato.status === 'ativo') {
          // Verificar se tem pagamento atrasado
          const pendentes = registrosData.filter(
            (r) => r.contrato_id === contrato.id && !r.recebido && r.data_vencimento
          )
          const hoje = new Date()
          const temAtrasado = pendentes.some(
            (p) => p.data_vencimento && new Date(p.data_vencimento) < hoje
          )
          if (temAtrasado) {
            atrasados++
          } else {
            emDia++
          }
        }
      }

      return {
        totalAReceber,
        totalRecebido,
        totalFaturado,
        totalContratos: contratosData.length,
        contratosAtivos,
        clientesAtivos,
        contratosEmDia: emDia,
        contratosParciais: parciais,
        contratosQuitados: quitados,
        contratosAtrasados: atrasados,
      }
    },
    enabled: !!freelancerId,
    staleTime: 1000 * 60 * 2,
  })
}

// ============================================================
// Input para criar registro financeiro
// ============================================================
export interface CreateRegistroInput {
  freelancerId: string
  contrato_id?: string
  descricao: string
  valor: number
  data_vencimento?: string
  data_recebimento?: string
  recebido: boolean
  forma_pagamento?: string
  observacoes?: string
}

// ============================================================
// HOOK: useCreateRegistro
// ============================================================
export function useCreateRegistro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRegistroInput) => {
      const { freelancerId, ...data } = input

      // Nota: forma_pagamento foi removido temporariamente do insert
      // Rode no Supabase: ALTER TABLE registros_financeiros ADD COLUMN forma_pagamento VARCHAR(50);
      // Depois descomente a linha forma_pagamento abaixo
      const insertData = {
        freelancer_id: freelancerId,
        contrato_id: data.contrato_id || null,
        descricao: data.descricao,
        valor: data.valor,
        data_vencimento: data.data_vencimento || null,
        data_recebimento: data.data_recebimento || null,
        recebido: data.recebido,
        // forma_pagamento: data.forma_pagamento || null, // DESCOMENTE APOS RODAR O ALTER TABLE
        observacoes: data.observacoes || null,
      }

      const { data: result, error } = await supabase
        .from('registros_financeiros')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('[useFinanceiro] Erro ao criar registro:', error)
        throw error
      }

      return toFinancialRecord(result as RegistroFinanceiroRecord)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-financeiros'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ============================================================
// HOOK: useUpdateRegistro
// ============================================================
export function useUpdateRegistro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateRegistroInput> }) => {
      const updateData: Record<string, unknown> = {}

      if (data.contrato_id !== undefined) updateData.contrato_id = data.contrato_id || null
      if (data.descricao !== undefined) updateData.descricao = data.descricao
      if (data.valor !== undefined) updateData.valor = data.valor
      if (data.data_vencimento !== undefined) updateData.data_vencimento = data.data_vencimento || null
      if (data.data_recebimento !== undefined) updateData.data_recebimento = data.data_recebimento || null
      if (data.recebido !== undefined) updateData.recebido = data.recebido
      if (data.forma_pagamento !== undefined) updateData.forma_pagamento = data.forma_pagamento || null
      if (data.observacoes !== undefined) updateData.observacoes = data.observacoes || null

      const { error } = await supabase
        .from('registros_financeiros')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('[useFinanceiro] Erro ao atualizar registro:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-financeiros'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ============================================================
// HOOK: useDeleteRegistro
// ============================================================
export function useDeleteRegistro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('registros_financeiros')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[useFinanceiro] Erro ao deletar registro:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-financeiros'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ============================================================
// HOOK: useMarcarRecebido
// ============================================================
export function useMarcarRecebido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, recebido, data_recebimento }: {
      id: string
      recebido: boolean
      data_recebimento?: string
    }) => {
      const { error } = await supabase
        .from('registros_financeiros')
        .update({
          recebido,
          data_recebimento: recebido ? (data_recebimento || new Date().toISOString().split('T')[0]) : null,
        })
        .eq('id', id)

      if (error) {
        console.error('[useFinanceiro] Erro ao marcar recebido:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros-financeiros'] })
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
