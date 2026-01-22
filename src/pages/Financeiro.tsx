import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useFreelancerContext } from '@/contexts/FreelancerContext'
import {
  useContratosFin,
  useResumoFinanceiro,
  useRegistrosFinanceiros,
  useCreateRegistro,
  useMarcarRecebido,
} from '@/hooks/useFinanceiro'

// Formatar valor como moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatar data
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function Financeiro() {
  const { freelancerId, isLoading: freelancerLoading } = useFreelancerContext()
  const { data: contratos, isLoading: contratosLoading } = useContratosFin(freelancerId)
  const { data: resumo, isLoading: resumoLoading } = useResumoFinanceiro(freelancerId)
  const { data: registros, isLoading: registrosLoading } = useRegistrosFinanceiros(freelancerId)
  const createRegistro = useCreateRegistro()
  const marcarRecebido = useMarcarRecebido()

  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    contrato_id: '',
    valor: '',
    data_recebimento: new Date().toISOString().split('T')[0],
    forma_pagamento: '',
    observacoes: '',
  })

  const isLoading = freelancerLoading || contratosLoading || resumoLoading || registrosLoading

  const handleSubmit = async () => {
    if (!freelancerId) return

    if (!formData.contrato_id || !formData.valor) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    const contratoSelecionado = contratos?.find((c) => c.id === formData.contrato_id)

    try {
      await createRegistro.mutateAsync({
        freelancerId,
        contrato_id: formData.contrato_id,
        descricao: `Pagamento - ${contratoSelecionado?.servico_nome || 'Contrato'}`,
        valor: parseFloat(formData.valor.replace(',', '.')),
        data_recebimento: formData.data_recebimento,
        recebido: true,
        forma_pagamento: formData.forma_pagamento || undefined,
        observacoes: formData.observacoes || undefined,
      })

      toast.success('Pagamento registrado com sucesso')
      setOpen(false)
      setFormData({
        contrato_id: '',
        valor: '',
        data_recebimento: new Date().toISOString().split('T')[0],
        forma_pagamento: '',
        observacoes: '',
      })
    } catch (err) {
      console.error('[Financeiro] Erro ao registrar pagamento:', err)
      // Verifica se é erro de tabela inexistente
      const errorObj = err as { code?: string; message?: string }
      if (errorObj.code === '42P01') {
        toast.error('Tabela de registros financeiros nao existe. Execute a migracao.')
      } else if (errorObj.message) {
        toast.error(`Erro: ${errorObj.message}`)
      } else {
        toast.error('Erro ao registrar pagamento')
      }
    }
  }

  const handleToggleRecebido = async (id: string, recebido: boolean) => {
    try {
      await marcarRecebido.mutateAsync({
        id,
        recebido: !recebido,
      })
      toast.success(recebido ? 'Marcado como pendente' : 'Marcado como recebido')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="page-header">
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">
            Registre manualmente seus recebimentos para manter controle financeiro dos seus projetos.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!contratos || contratos.length === 0} className="btn-primary gap-2 w-full sm:w-auto">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contrato">
                  Contrato <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.contrato_id}
                  onValueChange={(v) => setFormData({ ...formData, contrato_id: v })}
                >
                  <SelectTrigger id="contrato">
                    <SelectValue placeholder="Selecione o contrato..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contratos?.map((contrato) => (
                      <SelectItem key={contrato.id} value={contrato.id}>
                        {contrato.servico_nome} - {contrato.cliente_nome} ({formatCurrency(contrato.valor)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorRecebido">
                  Valor recebido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="valorRecebido"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataRecebimento">
                  Data do recebimento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dataRecebimento"
                  type="date"
                  value={formData.data_recebimento}
                  onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de pagamento</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
                >
                  <SelectTrigger id="formaPagamento">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartao de credito</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observacao</Label>
                <Textarea
                  id="observacao"
                  placeholder="Alguma nota sobre este pagamento..."
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={createRegistro.isPending}
                >
                  {createRegistro.isPending ? 'Salvando...' : 'Salvar pagamento'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="contas" className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="resumo" className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Resumo Financeiro
          </TabsTrigger>
        </TabsList>

        {/* Tab: Contas a Receber (Contratos) */}
        <TabsContent value="contas" className="space-y-4">
          <p className="text-sm text-gray-500">
            {isLoading ? 'Carregando...' : `${contratos?.length || 0} contrato(s) cadastrado(s)`}
          </p>

          {isLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center text-gray-500 flex items-center justify-center gap-3">
                <span className="loading-spinner w-5 h-5 border-gray-300 border-t-primary"></span>
                Carregando contratos...
              </CardContent>
            </Card>
          ) : !contratos || contratos.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="empty-state py-16">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Nenhum contrato cadastrado</h3>
                <p className="empty-state-description">Crie contratos para comecar a controlar seus recebimentos.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contratos.map((contrato) => {
                // Calcular pagamentos do contrato
                const pagamentosContrato = registros?.filter(
                  (r) => r.contract_id === contrato.id && r.is_received
                ) || []
                const totalPago = pagamentosContrato.reduce((sum, r) => sum + r.amount, 0)
                const percentPago = contrato.valor > 0 ? Math.round((totalPago / contrato.valor) * 100) : 0

                return (
                  <Card key={contrato.id} className="card-hover border border-gray-100 shadow-sm">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{contrato.servico_nome}</h3>
                            <Badge variant={contrato.status === 'ativo' ? 'default' : 'secondary'}>
                              {contrato.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{contrato.cliente_nome}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(contrato.valor)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Recebido: {formatCurrency(totalPago)} ({percentPago}%)
                          </p>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentPago >= 100
                              ? 'bg-green-500'
                              : percentPago > 0
                              ? 'bg-blue-500'
                              : 'bg-gray-200'
                          }`}
                          style={{ width: `${Math.min(percentPago, 100)}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Pagamentos */}
        <TabsContent value="pagamentos" className="space-y-4">
          <p className="text-sm text-gray-500">
            {isLoading ? 'Carregando...' : `${registros?.length || 0} pagamento(s) registrado(s)`}
          </p>

          {isLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-8 text-center text-gray-500 flex items-center justify-center gap-3">
                <span className="loading-spinner w-5 h-5 border-gray-300 border-t-primary"></span>
                Carregando pagamentos...
              </CardContent>
            </Card>
          ) : !registros || registros.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="empty-state py-16">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Nenhum pagamento registrado</h3>
                <p className="empty-state-description">Registre pagamentos para acompanhar seus recebimentos.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {registros.map((registro) => {
                const contrato = contratos?.find((c) => c.id === registro.contract_id)
                return (
                  <Card key={registro.id} className="card-hover border border-gray-100 shadow-sm">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{registro.description}</h3>
                            <Badge variant={registro.is_received ? 'default' : 'secondary'}>
                              {registro.is_received ? 'Recebido' : 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {contrato?.cliente_nome || 'Contrato removido'}
                            {registro.payment_method && ` - ${registro.payment_method.toUpperCase()}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {registro.is_received
                              ? `Recebido em ${formatDate(registro.received_date)}`
                              : registro.due_date
                              ? `Vencimento: ${formatDate(registro.due_date)}`
                              : 'Sem data de vencimento'}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className={`text-lg font-semibold ${registro.is_received ? 'text-green-600' : 'text-gray-900'}`}>
                              {formatCurrency(registro.amount)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRecebido(registro.id, registro.is_received)}
                          >
                            {registro.is_received ? 'Desfazer' : 'Receber'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Resumo */}
        <TabsContent value="resumo" className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2.5">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(resumo?.totalAReceber || 0)}
                    </p>
                    <p className="text-xs font-medium text-blue-600">Total a receber</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2.5">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(resumo?.totalRecebido || 0)}
                    </p>
                    <p className="text-xs font-medium text-green-600">Total recebido</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2.5">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(resumo?.totalFaturado || 0)}
                    </p>
                    <p className="text-xs font-medium text-gray-500">Total faturado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2.5">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-purple-600">
                      {resumo?.totalContratos || 0}
                    </p>
                    <p className="text-xs font-medium text-purple-600">Contratos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Informacao */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-gray-900">{resumo?.clientesAtivos || 0}</p>
                <p className="text-sm text-gray-500">clientes com contratos ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Contratos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-gray-900">{resumo?.contratosAtivos || 0}</p>
                <p className="text-sm text-gray-500">contratos em andamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Situacao dos Contratos */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Situacao dos Contratos</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-green-100 p-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{resumo?.contratosEmDia || 0}</p>
                      <p className="text-xs text-gray-500">Em dia</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-yellow-100 p-2">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{resumo?.contratosParciais || 0}</p>
                      <p className="text-xs text-gray-500">Parcial</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-blue-100 p-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{resumo?.contratosQuitados || 0}</p>
                      <p className="text-xs text-gray-500">Quitado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-red-100 p-2">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{resumo?.contratosAtrasados || 0}</p>
                      <p className="text-xs text-gray-500">Em atraso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
