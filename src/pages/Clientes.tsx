import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFreelancerContext } from '@/contexts/FreelancerContext'
import { useClients } from '@/hooks/useClients'
import type { ClientWithMetrics } from '@/hooks/useClients'

// ============================================================
// PAGINA DE CLIENTES (SOMENTE LEITURA)
// ============================================================
// Esta pagina exibe uma listagem consolidada dos clientes.
// Clientes sao criados automaticamente via propostas/contratos.
// NAO existe cadastro manual de clientes.
// ============================================================

// Formatar valor como moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatar data relativa
function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias atras`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atras`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atras`
  return `${Math.floor(diffDays / 365)} anos atras`
}

// Linha de cliente individual (padrao lista como Meus Documentos)
function ClientRow({ client, index }: { client: ClientWithMetrics; index: number }) {
  const locationParts = [client.cidade, client.estado].filter(Boolean)
  const location = locationParts.length > 0 ? locationParts.join(' / ') : null

  return (
    <Card
      className="card-hover border border-gray-100 shadow-sm animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            {/* Avatar */}
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shrink-0 shadow-sm">
              <span className="text-sm font-bold text-primary">
                {client.nome.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Informacoes principais */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm font-semibold text-gray-900 sm:text-base truncate">{client.nome}</h3>
                <Badge variant={client.tipo_pessoa === 'pj' ? 'secondary' : 'outline'} className="shrink-0 text-[10px]">
                  {client.tipo_pessoa === 'pj' ? 'PJ' : 'PF'}
                </Badge>
              </div>
              {client.razao_social && (
                <p className="text-xs text-gray-500 truncate">{client.razao_social}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {client.email && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate max-w-[150px]">{client.email}</span>
                  </span>
                )}
                {client.telefone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {client.telefone}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metricas - lado direito */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="font-semibold text-blue-600">{client.proposals_count}</span> propostas
                <span className="text-gray-300">|</span>
                <span className="font-semibold text-green-600">{client.contracts_count}</span> contratos
              </div>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(client.total_contracts_value)}</p>
              <p className="text-xs text-gray-400">{formatRelativeDate(client.last_interaction)}</p>
            </div>
            {/* Mobile: apenas valor */}
            <div className="text-right sm:hidden">
              <p className="text-sm font-medium text-gray-900">{formatCurrency(client.total_contracts_value)}</p>
              <p className="text-xs text-gray-500">{client.contracts_count} contratos</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de loading (padrao lista)
function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Estado vazio
function EmptyState() {
  return (
    <Card className="col-span-full border-0 shadow-sm">
      <CardContent className="empty-state py-16">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="empty-state-title">Nenhum cliente ainda</h3>
        <p className="empty-state-description mb-4">
          Os clientes sao criados automaticamente quando voce cria uma proposta ou contrato.
          Comece criando sua primeira proposta!
        </p>
        <p className="text-xs text-gray-400">
          Dica: Se voce ja criou propostas mas nao ve clientes, pode ser necessario executar a migration do banco de dados.
        </p>
      </CardContent>
    </Card>
  )
}

export default function Clientes() {
  const { freelancerId, isLoading: freelancerLoading } = useFreelancerContext()
  const { data: clients, isLoading, error } = useClients(freelancerId)

  // Calcular totais
  const totals = clients?.reduce(
    (acc, client) => ({
      totalClientes: acc.totalClientes + 1,
      totalPropostas: acc.totalPropostas + client.proposals_count,
      totalContratos: acc.totalContratos + client.contracts_count,
      totalValorPropostas: acc.totalValorPropostas + client.total_proposals_value,
      totalValorContratos: acc.totalValorContratos + client.total_contracts_value,
    }),
    { totalClientes: 0, totalPropostas: 0, totalContratos: 0, totalValorPropostas: 0, totalValorContratos: 0 }
  ) || { totalClientes: 0, totalPropostas: 0, totalContratos: 0, totalValorPropostas: 0, totalValorContratos: 0 }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <p className="page-subtitle">
          Visao consolidada dos seus clientes (criados automaticamente via propostas e contratos)
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{totals.totalClientes}</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wide">Propostas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totals.totalPropostas}</p>
            <p className="text-sm text-blue-500">{formatCurrency(totals.totalValorPropostas)}</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-600 uppercase tracking-wide">Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totals.totalContratos}</p>
            <p className="text-sm text-green-500">{formatCurrency(totals.totalValorContratos)}</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalValorContratos)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contador */}
      {clients && clients.length > 0 && (
        <p className="text-sm text-gray-500">
          {clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Lista de clientes */}
      {freelancerLoading || isLoading ? (
        <LoadingState />
      ) : error ? (
        <Card className="col-span-full">
          <CardContent className="py-8 text-center text-red-500">
            Erro ao carregar clientes. Tente novamente.
          </CardContent>
        </Card>
      ) : !clients || clients.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {clients.map((client, index) => (
            <ClientRow key={client.id} client={client} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
