import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboard, emptyMetrics } from '@/hooks/useDashboard'
import { useAuth } from '@/contexts/AuthContext'
import FeedbackModal from '@/components/FeedbackModal'
import { MessageSquare } from 'lucide-react'

// Formatar valor em reais
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Extrai apenas o primeiro nome do nome completo
function getFirstName(fullName: string): string {
  if (!fullName) return ''
  return fullName.split(' ')[0]
}

export default function Dashboard() {
  const { data: metrics = emptyMetrics, isLoading } = useDashboard()
  const { user } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  // Pega o nome completo e extrai apenas o primeiro nome
  const fullName = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuario'
  const userName = getFirstName(fullName)

  // Componente de skeleton para loading
  const MetricSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
      <div className="h-4 bg-gray-100 rounded w-20"></div>
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Ola, {userName}</h1>
          <p className="page-subtitle">Acompanhe o resumo do seu negocio</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setFeedbackOpen(true)}
          className="w-full sm:w-auto gap-2 hover:bg-primary/5 hover:border-primary/30"
        >
          <MessageSquare className="h-4 w-4" />
          Enviar Feedback
        </Button>
      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                {isLoading ? <MetricSkeleton /> : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{metrics.proposalsEnviadas}</p>
                    <p className="text-xs font-medium text-gray-500">Enviadas</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                {isLoading ? <MetricSkeleton /> : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.proposalsAceitas}
                      <span className="text-sm font-normal text-gray-400 ml-1">
                        ({metrics.proposalsAceitasPercent}%)
                      </span>
                    </p>
                    <p className="text-xs font-medium text-gray-500">Aceitas</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                {isLoading ? <MetricSkeleton /> : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{metrics.proposalsEncerradas}</p>
                    <p className="text-xs font-medium text-gray-500">Encerradas</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                {isLoading ? <MetricSkeleton /> : (
                  <>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(metrics.totalProposto)}</p>
                    <p className="text-xs font-medium text-gray-500">Total proposto</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                {isLoading ? <MetricSkeleton /> : (
                  <>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(metrics.totalFechado)}</p>
                    <p className="text-xs font-medium text-gray-500">Total fechado</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2.5">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                {isLoading ? <MetricSkeleton /> : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{metrics.taxaFechamento}%</p>
                    <p className="text-xs font-medium text-gray-500">Taxa de fechamento</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline de Propostas */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 tracking-tight">Pipeline de Propostas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
          <Card className="card-hover border border-gray-100 shadow-sm hover:border-gray-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2.5">
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '-' : metrics.pipelineRascunho}
                  </p>
                  <p className="text-xs font-medium text-gray-500">Rascunho</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-blue-100 shadow-sm hover:border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2.5">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '-' : metrics.pipelineEnviada}
                  </p>
                  <p className="text-xs font-medium text-blue-600">Enviada</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-green-100 shadow-sm hover:border-green-200 bg-gradient-to-br from-green-50/50 to-white">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2.5">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '-' : metrics.pipelineAceita}
                  </p>
                  <p className="text-xs font-medium text-green-600">Aceita</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-gray-100 shadow-sm hover:border-gray-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2.5">
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '-' : metrics.pipelineEncerrada}
                  </p>
                  <p className="text-xs font-medium text-gray-500">Encerrada</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-red-100 shadow-sm hover:border-red-200 bg-gradient-to-br from-red-50/30 to-white">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2.5">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '-' : metrics.pipelineExpirada}
                  </p>
                  <p className="text-xs font-medium text-red-500">Expirada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t border-gray-100" />
      {/* Resumo Inferior */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Contratos */}
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
              <div className="rounded-lg bg-purple-100 p-2">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Contratos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Criados</span>
              <span className="text-sm font-semibold text-gray-900">
                {isLoading ? '-' : metrics.contratosCriados}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Ativos</span>
              <span className="text-sm font-semibold text-blue-600">
                {isLoading ? '-' : metrics.contratosAtivos}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-gray-500">Finalizados</span>
              <span className="text-sm font-semibold text-green-600">
                {isLoading ? '-' : metrics.contratosFinalizados}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
              <div className="rounded-lg bg-emerald-100 p-2">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Ja recebido</span>
              <span className="text-sm font-semibold text-green-600">
                {isLoading ? '-' : formatCurrency(metrics.jaRecebido)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">A receber</span>
              <span className="text-sm font-semibold text-amber-600">
                {isLoading ? '-' : formatCurrency(metrics.aReceber)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-gray-500">Valor contratos</span>
              <span className="text-sm font-semibold text-gray-900">
                {isLoading ? '-' : formatCurrency(metrics.valorContratos)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metricas */}
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
              <div className="rounded-lg bg-amber-100 p-2">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              Totais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Propostas</span>
              <span className="text-sm font-semibold text-gray-900">
                {isLoading ? '-' : metrics.totalPropostas}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-gray-500">Contratos</span>
              <span className="text-sm font-semibold text-gray-900">
                {isLoading ? '-' : metrics.totalContratos}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
