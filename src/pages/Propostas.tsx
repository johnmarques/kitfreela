import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFreelancerContext } from '@/contexts/FreelancerContext'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { useCreateProposal, useUpdateProposal, useProposalById, getErrorMessage } from '@/hooks/useProposals'
import { findOrCreateClient } from '@/hooks/useClients'
import { useSubscription } from '@/hooks/useSubscription'
import type { ProposalStatus } from '@/types'

export default function Propostas() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { freelancerId, isLoading: freelancerLoading } = useFreelancerContext()
  const { formatDate } = useSettingsContext()
  const createProposal = useCreateProposal()
  const updateProposal = useUpdateProposal()
  const subscription = useSubscription()

  // Detecta ID da proposta na URL para modo edicao
  const editingId = searchParams.get('id')

  // Estados do formulario (nomes em portugues para corresponder ao banco)
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [servico, setServico] = useState('')
  const [escopo, setEscopo] = useState('')
  const [prazo, setPrazo] = useState('')
  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [status, setStatus] = useState<ProposalStatus>('rascunho')
  const [followupData, setFollowupData] = useState('')
  const [followupCanal, setFollowupCanal] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Estados de UI
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Busca proposta existente se tiver ID na URL
  const { data: existingProposal, isLoading: loadingExisting } = useProposalById(editingId || undefined)

  // Formata numero para exibicao no campo de valor (ex: 1500 -> "1.500,00")
  const formatNumberToDisplay = (num: number): string => {
    if (!num || num === 0) return ''
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Carrega dados da proposta existente no formulario
  useEffect(() => {
    if (editingId && existingProposal) {
      console.log('[Propostas] Carregando proposta para edicao:', editingId)

      setClienteNome(existingProposal.cliente_nome || '')
      setClienteTelefone(existingProposal.cliente_telefone || '')
      setClienteEmail(existingProposal.cliente_email || '')
      setServico(existingProposal.servico || '')
      setEscopo(existingProposal.escopo || '')
      setPrazo(existingProposal.prazo || '')
      // Formata o valor do banco para exibicao correta (1500 -> "1.500,00")
      setValor(formatNumberToDisplay(existingProposal.valor || 0))
      setFormaPagamento(existingProposal.forma_pagamento || '')
      setStatus(existingProposal.status || 'rascunho')
      setFollowupData(existingProposal.followup_data || '')
      setFollowupCanal(existingProposal.followup_canal || '')
      setObservacoes(existingProposal.observacoes || '')

      setSavedProposalId(existingProposal.id)
      setIsEditing(true)

      console.log('[Propostas] Dados carregados. Modo edicao ativo.')
    }
  }, [editingId, existingProposal])

  // ID atual da proposta (existente ou recem-criada)
  const currentProposalId = savedProposalId || editingId

  // Converte valor string para numero
  // Formato brasileiro: 1.500,00 (ponto = milhar, virgula = decimal)
  const parseValor = (val: string): number => {
    // Remove tudo exceto digitos, virgula e ponto
    let cleaned = val.replace(/[^\d,.-]/g, '')
    // Remove pontos de milhar (separador de milhares brasileiro)
    cleaned = cleaned.replace(/\./g, '')
    // Troca virgula decimal por ponto (formato internacional)
    cleaned = cleaned.replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  // Mascara para telefone: (XX) XXXXX-XXXX
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  // Mascara para valor monetario: R$ X.XXX,XX
  const formatCurrencyInput = (value: string): string => {
    // Remove tudo exceto digitos
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''

    // Converte para centavos e formata
    const cents = parseInt(digits, 10)
    const reais = cents / 100

    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Prepara dados do formulario para o hook
  const getFormData = (statusOverride?: ProposalStatus) => ({
    cliente_nome: clienteNome,
    cliente_email: clienteEmail || undefined,
    cliente_telefone: clienteTelefone || undefined,
    servico,
    escopo: escopo || undefined,
    prazo: prazo || undefined,
    valor: parseValor(valor),
    forma_pagamento: formaPagamento || undefined,
    status: statusOverride || status,
    followup_data: followupData || undefined,
    followup_canal: followupCanal || undefined,
    observacoes: observacoes || undefined,
  })

  // Valida campos obrigatorios
  const validateForm = (): string | null => {
    if (!clienteNome.trim()) return 'Nome do cliente é obrigatório'
    if (!servico.trim()) return 'Serviço é obrigatório'
    if (!valor.trim() || parseValor(valor) <= 0) return 'Valor é obrigatório e deve ser maior que zero'
    return null
  }

  // Salvar como rascunho (INSERT ou UPDATE)
  const handleSaveDraft = async () => {
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!freelancerId) {
      setError('Aguarde o carregamento dos dados do freelancer.')
      return
    }

    setIsSaving(true)

    try {
      // 1. Tentar criar/encontrar cliente automaticamente (opcional)
      console.log('[Propostas] Buscando ou criando cliente...')
      let clienteId: string | null = null
      try {
        clienteId = await findOrCreateClient({
          freelancer_id: freelancerId,
          nome: clienteNome,
          email: clienteEmail || undefined,
          telefone: clienteTelefone || undefined,
        })
        console.log('[Propostas] Cliente ID:', clienteId)
      } catch (clientError) {
        console.warn('[Propostas] Não foi possível criar cliente, continuando sem:', clientError)
      }

      // 2. Se ja existe uma proposta, faz UPDATE
      if (currentProposalId) {
        console.log('[Propostas] Atualizando proposta existente:', currentProposalId)
        const result = await updateProposal.mutateAsync({
          id: currentProposalId,
          data: { ...getFormData(), cliente_id: clienteId || undefined },
        })
        console.log('[Propostas] Proposta atualizada! ID:', result.id)
        navigate('/app/documentos')
      } else {
        // 3. Senao, faz INSERT
        console.log('[Propostas] Criando nova proposta...')
        const result = await createProposal.mutateAsync({
          freelancerId: freelancerId,
          data: { ...getFormData('rascunho'), cliente_id: clienteId || undefined },
        })
        console.log('[Propostas] Proposta criada! ID:', result.id)
        setSavedProposalId(result.id)
        setIsEditing(true)
        navigate('/app/documentos')
      }
    } catch (err) {
      console.error('[Propostas] Erro ao salvar:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // Gerar documento (salva e mostra preview)
  const handleGenerateDocument = async () => {
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!freelancerId) {
      setError('Aguarde o carregamento dos dados do freelancer.')
      return
    }

    setIsGenerating(true)
    console.log('[Propostas] Gerando documento...')

    try {
      // 1. Tentar criar/encontrar cliente automaticamente (opcional)
      console.log('[Propostas] Buscando ou criando cliente...')
      let clienteId: string | null = null
      try {
        clienteId = await findOrCreateClient({
          freelancer_id: freelancerId,
          nome: clienteNome,
          email: clienteEmail || undefined,
          telefone: clienteTelefone || undefined,
        })
        console.log('[Propostas] Cliente ID:', clienteId)
      } catch (clientError) {
        console.warn('[Propostas] Não foi possível criar cliente, continuando sem:', clientError)
      }

      // Define status: se for rascunho, muda para enviada
      const newStatus = status === 'rascunho' ? 'enviada' : status

      // 2. Se ja existe uma proposta, faz UPDATE
      if (currentProposalId) {
        console.log('[Propostas] Atualizando proposta existente:', currentProposalId)
        const result = await updateProposal.mutateAsync({
          id: currentProposalId,
          data: { ...getFormData(newStatus), cliente_id: clienteId || undefined },
        })
        console.log('[Propostas] Documento atualizado! ID:', result.id)
        setStatus(newStatus)
        setShowPreview(true)
      } else {
        // 3. Senao, faz INSERT
        console.log('[Propostas] Criando nova proposta...')
        const result = await createProposal.mutateAsync({
          freelancerId: freelancerId,
          data: { ...getFormData(newStatus), cliente_id: clienteId || undefined },
        })
        console.log('[Propostas] Documento criado! ID:', result.id)
        setSavedProposalId(result.id)
        setIsEditing(true)
        setStatus(newStatus)
        setShowPreview(true)
      }
    } catch (err) {
      console.error('[Propostas] Erro ao gerar:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsGenerating(false)
    }
  }

  // Mostra preview sem salvar (apenas visualizacao local)
  const handleShowPreview = () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setShowPreview(true)
  }

  // Formata valor para exibicao
  const formatCurrency = (val: number): string => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  // formatDate agora vem do SettingsContext e respeita as configuracoes do usuario

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          {isEditing ? 'Editar Proposta' : 'Criar Proposta'}
        </h1>
        <p className="page-subtitle">
          {isEditing
            ? 'Altere os dados da proposta existente'
            : 'Preencha os dados e gere sua proposta profissional'}
        </p>
      </div>

      {/* Bloqueio pos-trial */}
      {!subscription.canCreateDocuments && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-amber-100 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8m0 0V6m0 2h2m-2 0H9m12 4a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-800">Periodo de teste encerrado</h3>
              <p className="mt-1 text-sm text-amber-700">
                Seu periodo de teste gratuito terminou. Assine o Plano Pro para continuar criando propostas e contratos ilimitados.
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/perfil')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Assinar Plano Pro
            </Button>
          </div>
        </div>
      )}

      {/* Loading ao carregar proposta existente */}
      {editingId && loadingExisting && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 animate-fade-in">
          <div className="flex items-center">
            <span className="loading-spinner mr-3 h-5 w-5 border-blue-200 border-t-blue-500"></span>
            <p className="text-sm font-medium text-blue-700">Carregando dados da proposta...</p>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-1.5">
              <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Erro ao salvar proposta</h3>
              <p className="mt-0.5 text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Layout Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-blue-100 p-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Dados da Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Nome do Cliente */}
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente *</Label>
                <Input
                  id="cliente"
                  placeholder="Ex: João Silva"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                />
              </div>

              {/* Telefone e Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(formatPhone(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: cliente@email.com"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Servico */}
              <div className="space-y-2">
                <Label htmlFor="servico">Serviço *</Label>
                <Input
                  id="servico"
                  placeholder="Ex: Desenvolvimento de Landing Page"
                  value={servico}
                  onChange={(e) => setServico(e.target.value)}
                />
              </div>

              {/* Escopo do Projeto */}
              <div className="space-y-2">
                <Label htmlFor="escopo">Escopo do Projeto</Label>
                <Textarea
                  id="escopo"
                  placeholder="Descreva o que será entregue, limites do projeto e responsabilidades."
                  rows={6}
                  value={escopo}
                  onChange={(e) => setEscopo(e.target.value)}
                />
              </div>

              {/* Prazo e Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prazo">Prazo</Label>
                  <Input
                    id="prazo"
                    placeholder="Ex: 15 dias úteis"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      id="valor"
                      placeholder="0,00"
                      value={valor}
                      onChange={(e) => setValor(formatCurrencyInput(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="pagamento">Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger id="pagamento">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência bancária</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão de crédito</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status da Proposta */}
              <div className="space-y-2">
                <Label htmlFor="status">Status da Proposta</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as ProposalStatus)}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="status" className={!isEditing ? 'opacity-60' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="aceita">Aceita</SelectItem>
                    <SelectItem value="encerrada">Encerrada</SelectItem>
                    <SelectItem value="expirada">Expirada</SelectItem>
                  </SelectContent>
                </Select>
                {!isEditing && (
                  <p className="text-xs text-gray-500">
                    Status sera definido automaticamente ao salvar
                  </p>
                )}
              </div>

              {/* Follow-up */}
              <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <h3 className="text-sm font-semibold text-gray-800">Follow-up</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataFollowup">Data do Próximo Follow-up</Label>
                    <Input
                      id="dataFollowup"
                      type="date"
                      value={followupData}
                      onChange={(e) => setFollowupData(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="canalFollowup">Canal de Follow-up</Label>
                    <Select value={followupCanal} onValueChange={setFollowupCanal}>
                      <SelectTrigger id="canalFollowup">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Observacoes Internas */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações internas (não aparecem na proposta)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Anotações sobre a negociação, preferências do cliente..."
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              {/* Botoes */}
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                {/* Salvar Rascunho - desabilitado apos proposta gerada */}
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={handleSaveDraft}
                  disabled={
                    isSaving ||
                    isGenerating ||
                    freelancerLoading ||
                    !freelancerId ||
                    !!(editingId && loadingExisting) || // Aguarda carregar proposta existente
                    !!(currentProposalId && showPreview) || // Desabilita apos gerar documento
                    !subscription.canCreateDocuments // Bloqueio pos-trial
                  }
                >
                  {isSaving ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isEditing ? 'Salvar Alteracoes' : 'Salvar Rascunho'}
                    </>
                  )}
                </Button>
                {/* Gerar/Atualizar Documento */}
                <Button
                  className="flex-1 h-11 btn-primary"
                  onClick={handleGenerateDocument}
                  disabled={
                    isSaving ||
                    isGenerating ||
                    freelancerLoading ||
                    !freelancerId ||
                    !!(editingId && loadingExisting) || // Aguarda carregar proposta existente
                    !subscription.canCreateDocuments // Bloqueio pos-trial
                  }
                >
                  {isGenerating ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isEditing ? 'Atualizando...' : 'Gerando...'}
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {isEditing ? 'Atualizar e Visualizar' : 'Gerar Documento'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="bg-gradient-to-b from-gray-50 to-gray-100/50 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold text-gray-700">Preview</CardTitle>
              {!showPreview && clienteNome && servico && valor && (
                <Button variant="ghost" size="sm" onClick={handleShowPreview}>
                  Visualizar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showPreview && clienteNome && servico ? (
                <div className="min-h-[600px] rounded-lg border border-gray-200 bg-white p-8 shadow-inner">
                  {/* Indicador de sucesso */}
                  {currentProposalId && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-100 p-3 flex items-center gap-2">
                      <div className="rounded-full bg-green-100 p-1">
                        <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-700">
                        {isEditing
                          ? `Proposta atualizada com sucesso`
                          : `Proposta salva com sucesso`}
                      </p>
                    </div>
                  )}

                  {/* Cabecalho da proposta */}
                  <div className="mb-8 border-b pb-6">
                    <h2 className="text-xl font-bold text-gray-900">PROPOSTA COMERCIAL</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Data: {formatDate(new Date().toISOString())}
                    </p>
                  </div>

                  {/* Dados do cliente */}
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">CLIENTE</h3>
                    <p className="text-gray-900">{clienteNome}</p>
                    {clienteEmail && <p className="text-sm text-gray-600">{clienteEmail}</p>}
                    {clienteTelefone && <p className="text-sm text-gray-600">{clienteTelefone}</p>}
                  </div>

                  {/* Servico */}
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">SERVIÇO</h3>
                    <p className="text-gray-900">{servico}</p>
                  </div>

                  {/* Escopo */}
                  {escopo && (
                    <div className="mb-6">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">ESCOPO</h3>
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{escopo}</p>
                    </div>
                  )}

                  {/* Prazo */}
                  {prazo && (
                    <div className="mb-6">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">PRAZO</h3>
                      <p className="text-gray-900">{prazo}</p>
                    </div>
                  )}

                  {/* Valor */}
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">INVESTIMENTO</h3>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(parseValor(valor))}
                    </p>
                    {formaPagamento && (
                      <p className="text-sm text-gray-600">
                        Forma de pagamento: {formaPagamento.toUpperCase()}
                      </p>
                    )}
                  </div>

                  {/* Follow-up */}
                  {followupData && (
                    <div className="mb-6 rounded bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Próximo follow-up: {formatDate(followupData)}
                        {followupCanal && ` via ${followupCanal}`}
                      </p>
                    </div>
                  )}

                  {/* Botoes de acao */}
                  <div className="mt-8 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/app/documentos')}
                    >
                      Ver em Documentos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(false)}
                    >
                      Continuar Editando
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[600px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8">
                  <div className="text-center">
                    <svg className="mx-auto mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      Preencha os campos obrigatórios para visualizar o preview
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
