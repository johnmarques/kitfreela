// Status das propostas conforme CLAUDE.md
export type ProposalStatus = 'rascunho' | 'enviada' | 'aceita' | 'encerrada' | 'expirada'

// Status dos contratos
export type ContractStatus = 'rascunho' | 'ativo' | 'finalizado' | 'cancelado'

// Proposta comercial
export interface Proposal {
  id: string
  user_id: string
  client_name: string
  client_email?: string
  client_phone?: string
  service: string
  scope?: string
  value: number
  deadline?: string
  payment_method?: string
  status: ProposalStatus
  followup_date?: string
  followup_channel?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Tipo de pessoa (PF ou PJ)
export type PersonType = 'pf' | 'pj'

// Tipo de prazo
export type DeadlineMode = 'days' | 'date'

// Formas de pagamento
export type PaymentType =
  | 'a-vista'
  | '2x'
  | '3x'
  | '50-50'
  | '30-70'
  | 'parcelado-acordo'

// Parcela de pagamento
export interface PaymentInstallment {
  number: number
  percentage: number
  amount: number
  due_date?: string
}

// Contrato
export interface Contract {
  id: string
  user_id: string
  proposal_id?: string
  // Dados do contratante
  person_type: PersonType
  client_name: string
  client_document?: string // CPF ou CNPJ
  client_rg?: string
  client_company_name?: string // Razao social (PJ)
  client_address?: string
  client_city?: string
  client_state?: string
  client_phone?: string
  client_email?: string
  // Servico
  service_name: string
  service_scope?: string
  deliverables?: string
  // Valor
  value: number
  // Prazo
  deadline_mode: DeadlineMode
  deadline_days?: number
  deadline_type?: 'dias-uteis' | 'dias-corridos'
  deadline_date?: string
  // Pagamento
  payment_type: PaymentType
  payment_installments?: PaymentInstallment[]
  payment_notes?: string
  // Status e datas
  status: ContractStatus
  contract_text?: string // Texto final renderizado
  created_at: string
  updated_at: string
}

// Registro financeiro (contas a receber/recebido)
export interface FinancialRecord {
  id: string
  user_id: string
  contract_id?: string
  description: string
  amount: number
  due_date?: string
  received_date?: string
  is_received: boolean
  payment_method?: 'pix' | 'transferencia' | 'boleto' | 'cartao' | 'dinheiro'
  notes?: string
  created_at: string
}

// Unidade de validade para propostas
export type ValidityUnit = 'dias' | 'semanas' | 'meses'

// Formato de data
export type DateFormat = 'dd/mm/aaaa' | 'mm/dd/aaaa' | 'aaaa-mm-dd'

// Configuracoes do usuario
export interface UserSettings {
  id: string
  user_id: string
  // Preferencias de documentos
  validade_proposta_padrao: number
  unidade_validade: ValidityUnit
  formato_data: DateFormat
  auto_save_rascunhos: boolean
  // Configuracoes de notificacoes
  notif_email: boolean
  notif_followup: boolean
  notif_propostas_expirando: boolean
  notif_pagamentos_pendentes: boolean
  // Timestamps
  created_at: string
  updated_at: string
}

// Valores padrao para novas configuracoes
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  validade_proposta_padrao: 30,
  unidade_validade: 'dias',
  formato_data: 'dd/mm/aaaa',
  auto_save_rascunhos: true,
  notif_email: true,
  notif_followup: true,
  notif_propostas_expirando: true,
  notif_pagamentos_pendentes: true,
}

// Métricas do Dashboard
export interface DashboardMetrics {
  // Propostas
  proposalsEnviadas: number
  proposalsAceitas: number
  proposalsAceitasPercent: number
  proposalsEncerradas: number
  totalProposto: number
  totalFechado: number
  taxaFechamento: number

  // Pipeline
  pipelineRascunho: number
  pipelineEnviada: number
  pipelineAceita: number
  pipelineEncerrada: number
  pipelineExpirada: number

  // Contratos
  contratosCriados: number
  contratosAtivos: number
  contratosFinalizados: number

  // Financeiro
  jaRecebido: number
  aReceber: number
  valorContratos: number

  // Totais
  totalPropostas: number
  totalContratos: number
}
