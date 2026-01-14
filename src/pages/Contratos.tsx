import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateContract, useUpdateContract, getContractById } from '@/hooks/useContracts'
import { getProposalById } from '@/hooks/useDocuments'
import { generatePdf } from '@/lib/pdf'
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCurrency,
  currencyToNumber,
  validateCPF,
  validateCNPJ,
  formatCurrency,
  formatDate,
  formatDateExtended,
} from '@/lib/masks'
import type {
  ContractStatus,
  PersonType,
  DeadlineMode,
  PaymentType,
  PaymentInstallment,
} from '@/types'

// Configuracoes de parcelas para cada tipo de pagamento
const PAYMENT_CONFIG: Record<PaymentType, { installments: number; percentages: number[] }> = {
  'a-vista': { installments: 1, percentages: [100] },
  '2x': { installments: 2, percentages: [50, 50] },
  '3x': { installments: 3, percentages: [33.33, 33.33, 33.34] },
  '50-50': { installments: 2, percentages: [50, 50] },
  '30-70': { installments: 2, percentages: [30, 70] },
  'parcelado-acordo': { installments: 0, percentages: [] },
}

// Labels para tipos de pagamento
const PAYMENT_LABELS: Record<PaymentType, string> = {
  'a-vista': 'A vista',
  '2x': '2x sem juros',
  '3x': '3x sem juros',
  '50-50': '50% + 50%',
  '30-70': '30% + 70%',
  'parcelado-acordo': 'Parcelado conforme acordo',
}

export default function Contratos() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()

  const editId = searchParams.get('id')
  const fromProposalId = searchParams.get('proposal')

  // Estado do formulario
  const [status, setStatus] = useState<ContractStatus>('rascunho')
  const [personType, setPersonType] = useState<PersonType>('pf')
  const [clientName, setClientName] = useState('')
  const [clientDocument, setClientDocument] = useState('')
  const [clientRg, setClientRg] = useState('')
  const [clientCompanyName, setClientCompanyName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientCity, setClientCity] = useState('')
  const [clientState, setClientState] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  const [serviceName, setServiceName] = useState('')
  const [serviceScope, setServiceScope] = useState('')
  const [deliverables, setDeliverables] = useState('')

  const [valueStr, setValueStr] = useState('')
  const value = currencyToNumber(valueStr)

  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>('days')
  const [deadlineDays, setDeadlineDays] = useState('')
  const [deadlineType, setDeadlineType] = useState<'dias-uteis' | 'dias-corridos'>('dias-uteis')
  const [deadlineDate, setDeadlineDate] = useState('')

  const [paymentType, setPaymentType] = useState<PaymentType>('a-vista')
  const [installmentDates, setInstallmentDates] = useState<string[]>(['', '', ''])
  const [paymentNotes, setPaymentNotes] = useState('')

  const [proposalId, setProposalId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Carregar dados se editando ou vindo de proposta
  useEffect(() => {
    async function loadData() {
      if (editId) {
        const contract = await getContractById(editId)
        if (contract) {
          setStatus(contract.status)
          setPersonType(contract.person_type || 'pf')
          setClientName(contract.client_name)
          setClientDocument(contract.client_document || '')
          setClientRg(contract.client_rg || '')
          setClientCompanyName(contract.client_company_name || '')
          setClientAddress(contract.client_address || '')
          setClientCity(contract.client_city || '')
          setClientState(contract.client_state || '')
          setClientPhone(contract.client_phone || '')
          setClientEmail(contract.client_email || '')
          setServiceName(contract.service_name)
          setServiceScope(contract.service_scope || '')
          setDeliverables(contract.deliverables || '')
          setValueStr(maskCurrency(String(Math.round(contract.value * 100))))
          setDeadlineMode(contract.deadline_mode || 'days')
          setDeadlineDays(contract.deadline_days?.toString() || '')
          setDeadlineType(contract.deadline_type || 'dias-uteis')
          setDeadlineDate(contract.deadline_date || '')
          setPaymentType(contract.payment_type || 'a-vista')
          if (contract.payment_installments) {
            setInstallmentDates(contract.payment_installments.map(i => i.due_date || ''))
          }
          setPaymentNotes(contract.payment_notes || '')
          setProposalId(contract.proposal_id)
          setShowPreview(true)
        }
      } else if (fromProposalId) {
        const proposal = await getProposalById(fromProposalId)
        if (proposal) {
          setClientName(proposal.client_name)
          setClientEmail(proposal.client_email || '')
          setClientPhone(proposal.client_phone || '')
          setServiceName(proposal.service || '')
          setServiceScope(proposal.scope || '')
          setValueStr(maskCurrency(String(Math.round(proposal.value * 100))))
          setProposalId(proposal.id)
          setShowPreview(true)
        }
      }
    }
    loadData()
  }, [editId, fromProposalId])

  // Calcular parcelas
  const installments = useMemo((): PaymentInstallment[] => {
    if (paymentType === 'parcelado-acordo') return []

    const config = PAYMENT_CONFIG[paymentType]
    return config.percentages.map((percentage, index) => ({
      number: index + 1,
      percentage,
      amount: (value * percentage) / 100,
      due_date: installmentDates[index] || undefined,
    }))
  }, [paymentType, value, installmentDates])

  // Validar documento
  const isDocumentValid = useMemo(() => {
    if (!clientDocument) return true
    if (personType === 'pf') {
      return validateCPF(clientDocument)
    }
    return validateCNPJ(clientDocument)
  }, [personType, clientDocument])

  // Mascara do documento
  const handleDocumentChange = (value: string) => {
    if (personType === 'pf') {
      setClientDocument(maskCPF(value))
    } else {
      setClientDocument(maskCNPJ(value))
    }
  }

  // Limpar documento ao mudar tipo
  const handlePersonTypeChange = (value: PersonType) => {
    setPersonType(value)
    setClientDocument('')
    setClientCompanyName('')
    setClientRg('')
  }

  // Gerar texto do contrato
  const contractText = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const clientInfo = personType === 'pf'
      ? `${clientName}${clientDocument ? `, inscrito no CPF sob o n. ${clientDocument}` : ''}${clientRg ? `, RG ${clientRg}` : ''}`
      : `${clientCompanyName || clientName}${clientDocument ? `, inscrita no CNPJ sob o n. ${clientDocument}` : ''}, neste ato representada por ${clientName}`

    const addressInfo = [clientAddress, clientCity, clientState].filter(Boolean).join(', ')

    const deadlineText = deadlineMode === 'days'
      ? `${deadlineDays} ${deadlineType === 'dias-uteis' ? 'dias uteis' : 'dias corridos'}`
      : deadlineDate ? `ate ${formatDateExtended(deadlineDate)}` : ''

    let paymentText = ''
    if (paymentType === 'parcelado-acordo') {
      paymentText = 'conforme acordo entre as partes'
    } else if (installments.length === 1) {
      paymentText = `a vista, no valor de ${formatCurrency(value)}`
      if (installments[0].due_date) {
        paymentText += `, com vencimento em ${formatDate(installments[0].due_date)}`
      }
    } else {
      paymentText = `em ${installments.length} parcelas:\n`
      paymentText += installments.map(i => {
        let text = `  - ${i.number}a parcela: ${formatCurrency(i.amount)} (${i.percentage}%)`
        if (i.due_date) text += ` - vencimento: ${formatDate(i.due_date)}`
        return text
      }).join('\n')
    }

    // Numeracao dinamica das clausulas
    let clausulaNum = 1

    const clausulaObjeto = clausulaNum++
    const clausulaEscopo = serviceScope ? clausulaNum++ : null
    const clausulaEntregas = deliverables ? clausulaNum++ : null
    const clausulaValor = clausulaNum++
    const clausulaPrazo = clausulaNum++
    const clausulaObrigacoesContratante = clausulaNum++
    const clausulaObrigacoesContratado = clausulaNum++
    const clausulaPropriedadeIntelectual = clausulaNum++
    const clausulaConfidencialidade = clausulaNum++
    const clausulaRescisao = clausulaNum++
    const clausulaNaoVinculacao = clausulaNum++
    const clausulaResponsabilidade = clausulaNum++
    const clausulaAlteracaoEscopo = clausulaNum++
    const clausulaSuspensao = clausulaNum++
    const clausulaAceiteEletronico = clausulaNum++
    const clausulaDisposicoesGerais = clausulaNum++
    const clausulaForo = clausulaNum++

    const numeroParaTexto = (n: number): string => {
      const numeros: Record<number, string> = {
        1: 'PRIMEIRA', 2: 'SEGUNDA', 3: 'TERCEIRA', 4: 'QUARTA',
        5: 'QUINTA', 6: 'SEXTA', 7: 'SETIMA', 8: 'OITAVA',
        9: 'NONA', 10: 'DECIMA', 11: 'DECIMA PRIMEIRA', 12: 'DECIMA SEGUNDA',
        13: 'DECIMA TERCEIRA', 14: 'DECIMA QUARTA', 15: 'DECIMA QUINTA',
        16: 'DECIMA SEXTA', 17: 'DECIMA SETIMA', 18: 'DECIMA OITAVA',
        19: 'DECIMA NONA', 20: 'VIGESIMA'
      }
      return numeros[n] || `${n}a`
    }

    return `
CONTRATO DE PRESTACAO DE SERVICOS

Pelo presente instrumento particular, de um lado:

CONTRATANTE: ${clientInfo}${addressInfo ? `\nEndereco: ${addressInfo}` : ''}${clientEmail ? `\nE-mail: ${clientEmail}` : ''}${clientPhone ? `\nTelefone: ${clientPhone}` : ''}

E de outro lado o CONTRATADO (prestador de servicos), tem entre si justo e acordado o seguinte:

CLAUSULA ${numeroParaTexto(clausulaObjeto)} - DO OBJETO
O presente contrato tem por objeto a prestacao dos seguintes servicos: ${serviceName}

Paragrafo unico: O CONTRATADO se compromete a executar os servicos com zelo, diligencia e boa tecnica, observando as especificacoes acordadas entre as partes.
${serviceScope ? `
CLAUSULA ${numeroParaTexto(clausulaEscopo!)} - DO ESCOPO
${serviceScope}

Paragrafo unico: Quaisquer servicos, funcionalidades ou entregas nao descritos expressamente nesta clausula estao fora do escopo deste contrato e, se solicitados, deverao ser objeto de nova negociacao.
` : ''}${deliverables ? `
CLAUSULA ${numeroParaTexto(clausulaEntregas!)} - DAS ENTREGAS
${deliverables}

Paragrafo unico: As entregas serao consideradas aprovadas apos o prazo de 5 (cinco) dias uteis contados do recebimento, caso o CONTRATANTE nao apresente ressalvas por escrito.
` : ''}
CLAUSULA ${numeroParaTexto(clausulaValor)} - DO VALOR E FORMA DE PAGAMENTO
O valor total dos servicos objeto deste contrato e de ${formatCurrency(value)}, a ser pago ${paymentText}
${paymentNotes ? `\nObservacoes: ${paymentNotes}` : ''}

Paragrafo primeiro: Em caso de atraso no pagamento, incidira multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mes, calculados pro rata die.

Paragrafo segundo: O CONTRATADO podera suspender a execucao dos servicos apos 10 (dez) dias de atraso no pagamento, sem que isso caracterize inadimplemento de sua parte.

CLAUSULA ${numeroParaTexto(clausulaPrazo)} - DO PRAZO
${deadlineText ? `O prazo para execucao dos servicos e de ${deadlineText}, contados a partir da assinatura deste contrato ou do recebimento de todas as informacoes e materiais necessarios, o que ocorrer por ultimo.` : 'O prazo sera definido em comum acordo entre as partes.'}

Paragrafo primeiro: O prazo podera ser prorrogado mediante acordo escrito entre as partes, especialmente nos casos de:
a) solicitacao de alteracoes no escopo pelo CONTRATANTE;
b) atraso no fornecimento de informacoes ou materiais pelo CONTRATANTE;
c) eventos de forca maior ou caso fortuito.

Paragrafo segundo: Eventuais atrasos causados exclusivamente pelo CONTRATANTE nao configuram inadimplemento do CONTRATADO.

CLAUSULA ${numeroParaTexto(clausulaObrigacoesContratante)} - DAS OBRIGACOES DO CONTRATANTE
Constituem obrigacoes do CONTRATANTE:
a) fornecer todas as informacoes, dados, materiais e acessos necessarios a execucao dos servicos, em tempo habil;
b) efetuar os pagamentos nas datas e condicoes acordadas;
c) designar responsavel para aprovacoes e comunicacoes;
d) responder tempestivamente as solicitacoes do CONTRATADO;
e) aprovar ou solicitar ajustes nas entregas dentro do prazo estipulado.

CLAUSULA ${numeroParaTexto(clausulaObrigacoesContratado)} - DAS OBRIGACOES DO CONTRATADO
Constituem obrigacoes do CONTRATADO:
a) executar os servicos de acordo com as especificacoes acordadas;
b) manter o CONTRATANTE informado sobre o andamento dos trabalhos;
c) cumprir os prazos estabelecidos, salvo nas hipoteses de prorrogacao previstas neste contrato;
d) prestar os esclarecimentos que se fizerem necessarios;
e) manter sigilo sobre informacoes confidenciais do CONTRATANTE.

CLAUSULA ${numeroParaTexto(clausulaPropriedadeIntelectual)} - DA PROPRIEDADE INTELECTUAL
Todos os direitos patrimoniais sobre os trabalhos desenvolvidos em razao deste contrato serao transferidos ao CONTRATANTE apos a quitacao integral do valor contratado.

Paragrafo primeiro: Ate a quitacao integral, o CONTRATADO mantera a titularidade dos direitos sobre os trabalhos desenvolvidos.

Paragrafo segundo: O CONTRATADO reserva-se o direito de utilizar os trabalhos em seu portfolio profissional, salvo disposicao expressa em contrario.

CLAUSULA ${numeroParaTexto(clausulaConfidencialidade)} - DA CONFIDENCIALIDADE
As partes se comprometem a manter em sigilo todas as informacoes confidenciais a que tiverem acesso em razao deste contrato, nao podendo divulga-las a terceiros sem autorizacao previa e expressa da outra parte.

Paragrafo unico: Esta obrigacao perdurara mesmo apos o termino ou rescisao deste contrato, pelo prazo de 2 (dois) anos.

CLAUSULA ${numeroParaTexto(clausulaRescisao)} - DA RESCISAO
O presente contrato podera ser rescindido:
a) por acordo mutuo entre as partes, formalizado por escrito;
b) por qualquer das partes, mediante aviso previo de 15 (quinze) dias, com pagamento proporcional pelos servicos ja executados;
c) de imediato, em caso de descumprimento de clausula contratual, apos notificacao e prazo de 5 (cinco) dias para regularizacao.

Paragrafo unico: Em caso de rescisao, o CONTRATANTE devera pagar ao CONTRATADO pelos servicos efetivamente prestados ate a data da rescisao.

CLAUSULA ${numeroParaTexto(clausulaNaoVinculacao)} - DA NAO VINCULACAO EMPREGATICIA
O presente contrato nao gera vinculo empregaticio, societario ou de qualquer outra natureza entre as partes, sendo o CONTRATADO profissional autonomo que executa os servicos com independencia tecnica e operacional.

Paragrafo primeiro: O CONTRATADO podera prestar servicos a outros clientes durante a vigencia deste contrato, nao havendo clausula de exclusividade, salvo se expressamente pactuada.

Paragrafo segundo: Cada parte sera responsavel pelos seus respectivos encargos fiscais, trabalhistas e previdenciarios.

CLAUSULA ${numeroParaTexto(clausulaResponsabilidade)} - DA LIMITACAO DE RESPONSABILIDADE
A responsabilidade do CONTRATADO limita-se ao valor total deste contrato, excluindo-se expressamente:
a) lucros cessantes;
b) danos indiretos ou consequenciais;
c) perdas decorrentes de decisoes comerciais ou estrategicas do CONTRATANTE;
d) danos causados por uso inadequado dos servicos ou entregas.

Paragrafo unico: O CONTRATADO nao se responsabiliza por falhas, interrupcoes ou perdas decorrentes de servicos de terceiros, incluindo hospedagem, dominios, APIs externas ou infraestrutura tecnologica nao fornecida pelo CONTRATADO.

CLAUSULA ${numeroParaTexto(clausulaAlteracaoEscopo)} - DA ALTERACAO DE ESCOPO
Qualquer alteracao no escopo dos servicos devera ser formalizada por escrito entre as partes.

Paragrafo primeiro: Alteracoes de escopo poderao implicar em:
a) ajuste no valor do contrato;
b) ajuste no prazo de entrega;
c) renegociacao das condicoes de pagamento.

Paragrafo segundo: O CONTRATADO nao e obrigado a executar servicos fora do escopo originalmente contratado sem a devida formalizacao e acordo sobre valores e prazos.

CLAUSULA ${numeroParaTexto(clausulaSuspensao)} - DA SUSPENSAO DOS SERVICOS
O CONTRATADO podera suspender a execucao dos servicos, sem que isso caracterize inadimplemento, nas seguintes hipoteses:
a) atraso superior a 10 (dez) dias no pagamento de qualquer parcela;
b) ausencia de fornecimento de informacoes, materiais ou acessos necessarios por prazo superior a 15 (quinze) dias apos solicitacao;
c) solicitacao expressa do CONTRATANTE.

Paragrafo unico: A retomada dos servicos ocorrera em ate 5 (cinco) dias uteis apos a regularizacao da pendencia que motivou a suspensao, podendo haver ajuste proporcional no prazo de entrega.

CLAUSULA ${numeroParaTexto(clausulaAceiteEletronico)} - DO ACEITE ELETRONICO
As partes reconhecem como valido o aceite eletronico deste contrato, realizado por meio de plataformas digitais, e-mail, aplicativos de mensagens ou qualquer outro meio eletronico que permita a identificacao das partes e a manifestacao inequivoca de vontade.

Paragrafo unico: O aceite eletronico confere ao presente instrumento plena validade juridica, nos termos da legislacao vigente, especialmente a Medida Provisoria n. 2.200-2/2001.

CLAUSULA ${numeroParaTexto(clausulaDisposicoesGerais)} - DAS DISPOSICOES GERAIS
Paragrafo primeiro: A eventual tolerancia de qualquer das partes quanto ao descumprimento de obrigacoes pela outra nao importara em novacao, renunciou ou alteracao do pactuado.

Paragrafo segundo: Se qualquer clausula deste contrato for considerada invalida ou inexequivel, as demais clausulas permanecerao em pleno vigor e efeito.

Paragrafo terceiro: Este contrato representa o acordo integral entre as partes sobre seu objeto, substituindo todos os entendimentos anteriores, verbais ou escritos.

Paragrafo quarto: Qualquer alteracao deste contrato somente sera valida se formalizada por escrito e assinada por ambas as partes.

CLAUSULA ${numeroParaTexto(clausulaForo)} - DO FORO
As partes elegem o foro da comarca do domicilio do CONTRATADO para dirimir quaisquer controversias oriundas deste contrato, com renuncia expressa a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, na presenca de duas testemunhas.

Local e data: _______________, ${today}


_________________________________
CONTRATANTE: ${clientName}


_________________________________
CONTRATADO


Testemunha 1: _________________________________
Nome:
CPF:

Testemunha 2: _________________________________
Nome:
CPF:
`.trim()
  }, [
    personType, clientName, clientDocument, clientRg, clientCompanyName,
    clientAddress, clientCity, clientState, clientEmail, clientPhone,
    serviceName, serviceScope, deliverables, value, deadlineMode,
    deadlineDays, deadlineType, deadlineDate, paymentType, installments, paymentNotes
  ])

  // Salvar contrato
  const handleSave = async () => {
    if (!clientName || !serviceName || !value) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    if (clientDocument && !isDocumentValid) {
      toast.error(`${personType === 'pf' ? 'CPF' : 'CNPJ'} invalido`)
      return
    }

    if (!user?.id) {
      toast.error('Usuario nao autenticado. Faca login novamente.')
      return
    }

    setIsLoading(true)

    try {
      const contractData = {
        user_id: user.id,
        proposal_id: proposalId,
        person_type: personType,
        client_name: clientName,
        client_document: clientDocument || undefined,
        client_rg: clientRg || undefined,
        client_company_name: clientCompanyName || undefined,
        client_address: clientAddress || undefined,
        client_city: clientCity || undefined,
        client_state: clientState || undefined,
        client_phone: clientPhone || undefined,
        client_email: clientEmail || undefined,
        service_name: serviceName,
        service_scope: serviceScope || undefined,
        deliverables: deliverables || undefined,
        value,
        deadline_mode: deadlineMode,
        deadline_days: deadlineMode === 'days' ? parseInt(deadlineDays) || undefined : undefined,
        deadline_type: deadlineMode === 'days' ? deadlineType : undefined,
        deadline_date: deadlineMode === 'date' ? deadlineDate || undefined : undefined,
        payment_type: paymentType,
        payment_installments: installments.length > 0 ? installments : undefined,
        payment_notes: paymentNotes || undefined,
        status,
        contract_text: contractText,
      }

      if (editId) {
        await updateContract.mutateAsync({ id: editId, data: contractData })
        toast.success('Contrato atualizado com sucesso')
      } else {
        await createContract.mutateAsync(contractData)
        toast.success('Contrato criado com sucesso')
      }

      navigate('/app/documentos')
    } catch {
      toast.error('Erro ao salvar contrato')
    } finally {
      setIsLoading(false)
    }
  }

  // Baixar PDF
  const handleDownloadPdf = async () => {
    if (!clientName || !serviceName) {
      toast.error('Preencha os dados do contrato primeiro')
      return
    }

    try {
      const doc = {
        id: editId || 'preview',
        type: 'contract' as const,
        title: `Contrato - ${serviceName} (${clientName})`,
        client_name: clientName,
        value,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service_name: serviceName,
        deliverables,
        client_cpf: clientDocument,
        client_address: [clientAddress, clientCity, clientState].filter(Boolean).join(', '),
        payment_notes: paymentNotes,
      }

      await generatePdf(doc)
      toast.success('PDF gerado com sucesso')
    } catch {
      toast.error('Erro ao gerar PDF')
    }
  }

  // Gerar documento (salvar + mostrar preview)
  const handleGenerate = () => {
    if (!clientName || !serviceName || !value) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    setShowPreview(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {editId ? 'Editar Contrato' : 'Criar Contrato'}
        </h1>
        <p className="text-sm text-gray-500">
          Gere um contrato de servico com clausulas profissionais
        </p>
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status do Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Contratante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contratante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de pessoa */}
              <div className="space-y-2">
                <Label>Tipo de pessoa</Label>
                <RadioGroup
                  value={personType}
                  onValueChange={(v) => handlePersonTypeChange(v as PersonType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pf" id="pf" />
                    <Label htmlFor="pf" className="font-normal">Pessoa Fisica</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pj" id="pj" />
                    <Label htmlFor="pj" className="font-normal">Pessoa Juridica</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  {personType === 'pf' ? 'Nome completo *' : 'Nome do representante *'}
                </Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={personType === 'pf' ? 'Nome do contratante' : 'Nome do representante'}
                />
              </div>

              {/* Razao social (PJ) */}
              {personType === 'pj' && (
                <div className="space-y-2">
                  <Label htmlFor="clientCompanyName">Razao Social</Label>
                  <Input
                    id="clientCompanyName"
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                    placeholder="Razao social da empresa"
                  />
                </div>
              )}

              {/* Documento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientDocument">
                    {personType === 'pf' ? 'CPF' : 'CNPJ'}
                  </Label>
                  <Input
                    id="clientDocument"
                    value={clientDocument}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    className={clientDocument && !isDocumentValid ? 'border-red-500' : ''}
                  />
                  {clientDocument && !isDocumentValid && (
                    <p className="text-xs text-red-500">
                      {personType === 'pf' ? 'CPF' : 'CNPJ'} invalido
                    </p>
                  )}
                </div>

                {personType === 'pf' && (
                  <div className="space-y-2">
                    <Label htmlFor="clientRg">RG (opcional)</Label>
                    <Input
                      id="clientRg"
                      value={clientRg}
                      onChange={(e) => setClientRg(e.target.value)}
                      placeholder="00.000.000-0"
                    />
                  </div>
                )}
              </div>

              {/* Endereco */}
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Endereco</Label>
                <Input
                  id="clientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Rua, numero, complemento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientCity">Cidade</Label>
                  <Input
                    id="clientCity"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientState">UF</Label>
                  <Input
                    id="clientState"
                    value={clientState}
                    onChange={(e) => setClientState(e.target.value.toUpperCase())}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefone</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">E-mail</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Servico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Nome do servico *</Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Desenvolvimento de website institucional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceScope">Escopo detalhado</Label>
                <Textarea
                  id="serviceScope"
                  value={serviceScope}
                  onChange={(e) => setServiceScope(e.target.value)}
                  placeholder="Descreva em detalhes o que sera entregue..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverables">Entregas</Label>
                <Textarea
                  id="deliverables"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="- Entrega 1: [descricao]&#10;- Entrega 2: [descricao]"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Valor, Prazo e Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valor, Prazo e Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="value">Valor total *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="value"
                    value={valueStr}
                    onChange={(e) => setValueStr(maskCurrency(e.target.value))}
                    placeholder="0,00"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Prazo */}
              <div className="space-y-2">
                <Label>Prazo</Label>
                <RadioGroup
                  value={deadlineMode}
                  onValueChange={(v) => setDeadlineMode(v as DeadlineMode)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="days" id="days" />
                    <Label htmlFor="days" className="font-normal">Em dias</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="date" />
                    <Label htmlFor="date" className="font-normal">Data final</Label>
                  </div>
                </RadioGroup>
              </div>

              {deadlineMode === 'days' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadlineDays">Quantidade de dias</Label>
                    <Input
                      id="deadlineDays"
                      type="number"
                      value={deadlineDays}
                      onChange={(e) => setDeadlineDays(e.target.value)}
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadlineType">Tipo</Label>
                    <Select value={deadlineType} onValueChange={(v) => setDeadlineType(v as typeof deadlineType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dias-uteis">Dias uteis</SelectItem>
                        <SelectItem value="dias-corridos">Dias corridos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="deadlineDate">Data final do projeto</Label>
                  <Input
                    id="deadlineDate"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                  />
                </div>
              )}

              {/* Forma de pagamento */}
              <div className="space-y-2">
                <Label htmlFor="paymentType">Forma de pagamento</Label>
                <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Datas das parcelas */}
              {paymentType !== 'parcelado-acordo' && installments.length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">Datas de vencimento</p>
                  {installments.map((inst, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 min-w-[120px]">
                        {inst.number}a parcela ({formatCurrency(inst.amount)})
                      </span>
                      <Input
                        type="date"
                        value={installmentDates[index] || ''}
                        onChange={(e) => {
                          const newDates = [...installmentDates]
                          newDates[index] = e.target.value
                          setInstallmentDates(newDates)
                        }}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Observacoes de pagamento */}
              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Observacoes de pagamento (opcional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Informacoes adicionais sobre o pagamento..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botoes */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSave}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button className="flex-1" onClick={handleGenerate}>
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar Documento
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="bg-gray-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Preview</CardTitle>
              {showPreview && (
                <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar PDF
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="rounded-lg border bg-white p-6 min-h-[600px]">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-gray-800">
                    {contractText}
                  </pre>
                </div>
              ) : (
                <div className="flex min-h-[600px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8">
                  <div className="text-center">
                    <svg className="mx-auto mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      Preencha os dados e clique em "Gerar Documento"
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
