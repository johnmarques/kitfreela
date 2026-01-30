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
import { useFreelancerContext } from '@/contexts/FreelancerContext'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { useCreateContract, useUpdateContract, getContractById } from '@/hooks/useContracts'
import { getProposalById } from '@/hooks/useDocuments'
import { findOrCreateClient } from '@/hooks/useClients'
import { useSubscription } from '@/hooks/useSubscription'
import PlanUpgradeModal from '@/components/PlanUpgradeModal'
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
  const { freelancerId } = useFreelancerContext()
  const { formatDate: formatDateFromSettings } = useSettingsContext()
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const subscription = useSubscription()

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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

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
        paymentText += `, com vencimento em ${formatDateFromSettings(installments[0].due_date)}`
      }
    } else {
      paymentText = `em ${installments.length} parcelas:\n`
      paymentText += installments.map(i => {
        let text = `  - ${i.number}a parcela: ${formatCurrency(i.amount)} (${i.percentage}%)`
        if (i.due_date) text += ` - vencimento: ${formatDateFromSettings(i.due_date)}`
        return text
      }).join('\n')
    }

    // Valores padrão para cláusulas novas
    const maxRevisions = 2
    const revisionDeadline = 5
    const supportPeriod = 30

    // Numeracao dinamica das clausulas
    let clausulaNum = 1

    const clausulaObjeto = clausulaNum++
    const clausulaEscopo = serviceScope ? clausulaNum++ : null
    const clausulaEntregas = deliverables ? clausulaNum++ : null
    const clausulaRevisoes = deliverables ? clausulaNum++ : null // Nova - após entregas
    const clausulaValor = clausulaNum++
    const clausulaPrazo = clausulaNum++
    const clausulaObrigacoesContratante = clausulaNum++
    const clausulaResponsabilidadeConteudo = clausulaNum++ // Nova - após obrigações contratante
    const clausulaObrigacoesContratado = clausulaNum++
    const clausulaPropriedadeIntelectual = clausulaNum++
    const clausulaConfidencialidade = clausulaNum++
    const clausulaProtecaoDados = clausulaNum++ // Nova - após confidencialidade
    const clausulaRescisao = clausulaNum++
    const clausulaNaoVinculacao = clausulaNum++
    const clausulaResponsabilidade = clausulaNum++
    const clausulaNaoGarantiaResultado = clausulaNum++ // Nova - após responsabilidade
    const clausulaAlteracaoEscopo = clausulaNum++
    const clausulaSuporte = clausulaNum++ // Nova - após alteração escopo
    const clausulaSuspensao = clausulaNum++
    const clausulaAceiteEletronico = clausulaNum++
    const clausulaComunicacoes = clausulaNum++ // Nova - após aceite eletrônico
    const clausulaDisposicoesGerais = clausulaNum++
    const clausulaSolucaoAmigavel = clausulaNum++ // Nova - antes do foro
    const clausulaForo = clausulaNum++

    const numeroParaTexto = (n: number): string => {
      const numeros: Record<number, string> = {
        1: 'PRIMEIRA', 2: 'SEGUNDA', 3: 'TERCEIRA', 4: 'QUARTA',
        5: 'QUINTA', 6: 'SEXTA', 7: 'SETIMA', 8: 'OITAVA',
        9: 'NONA', 10: 'DECIMA', 11: 'DECIMA PRIMEIRA', 12: 'DECIMA SEGUNDA',
        13: 'DECIMA TERCEIRA', 14: 'DECIMA QUARTA', 15: 'DECIMA QUINTA',
        16: 'DECIMA SEXTA', 17: 'DECIMA SETIMA', 18: 'DECIMA OITAVA',
        19: 'DECIMA NONA', 20: 'VIGESIMA', 21: 'VIGESIMA PRIMEIRA',
        22: 'VIGESIMA SEGUNDA', 23: 'VIGESIMA TERCEIRA', 24: 'VIGESIMA QUARTA',
        25: 'VIGESIMA QUINTA', 26: 'VIGESIMA SEXTA', 27: 'VIGESIMA SETIMA',
        28: 'VIGESIMA OITAVA', 29: 'VIGESIMA NONA', 30: 'TRIGESIMA'
      }
      return numeros[n] || `${n}a`
    }

    return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular, de um lado:

CONTRATANTE: ${clientInfo}${addressInfo ? `\nEndereço: ${addressInfo}` : ''}${clientEmail ? `\nE-mail: ${clientEmail}` : ''}${clientPhone ? `\nTelefone: ${clientPhone}` : ''}

E, de outro lado, o CONTRATADO (prestador de serviços), têm entre si justo e acordado o seguinte:

CLÁUSULA ${numeroParaTexto(clausulaObjeto)} - DO OBJETO  
O presente contrato tem por objeto a prestação dos seguintes serviços: ${serviceName}

Parágrafo único: O CONTRATADO se compromete a executar os serviços com zelo, diligência e boa técnica, observando as especificações acordadas entre as partes.
${serviceScope ? `
CLÁUSULA ${numeroParaTexto(clausulaEscopo!)} - DO ESCOPO
${serviceScope}

Parágrafo único: Quaisquer serviços, funcionalidades ou entregas não descritos expressamente nesta cláusula estão fora do escopo deste contrato e, se solicitados, deverão ser objeto de nova negociação.
` : ''}${deliverables ? `
CLÁUSULA ${numeroParaTexto(clausulaEntregas!)} - DAS ENTREGAS
${deliverables}

Parágrafo único: As entregas serão consideradas aprovadas após o prazo de 5 (cinco) dias úteis, contados do recebimento, caso o CONTRATANTE não apresente ressalvas por escrito.

CLÁUSULA ${numeroParaTexto(clausulaRevisoes!)} - DAS REVISÕES E AJUSTES
O CONTRATADO realizará até ${maxRevisions} rodada(s) de ajustes nas entregas, desde que solicitadas pelo CONTRATANTE no prazo de ${revisionDeadline} dias úteis contados do recebimento da entrega.

Parágrafo único: Solicitações de ajustes adicionais, fora do prazo ou em quantidade superior à prevista nesta cláusula, serão consideradas alteração de escopo, sujeitas a nova negociação de prazo e valor.
` : ''}
CLÁUSULA ${numeroParaTexto(clausulaValor)} - DO VALOR E FORMA DE PAGAMENTO
O valor total dos serviços objeto deste contrato é de ${formatCurrency(value)}, a ser pago ${paymentText}
${paymentNotes ? `\nObservações: ${paymentNotes}` : ''}

Parágrafo primeiro: Em caso de atraso no pagamento, incidirá multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.

Parágrafo segundo: O CONTRATADO poderá suspender a execução dos serviços após 10 (dez) dias de atraso no pagamento, sem que isso caracterize inadimplemento de sua parte.

CLÁUSULA ${numeroParaTexto(clausulaPrazo)} - DO PRAZO
${deadlineText ? `O prazo para execução dos serviços é de ${deadlineText}, contados a partir da assinatura deste contrato ou do recebimento de todas as informações e materiais necessários, o que ocorrer por último.` : 'O prazo será definido em comum acordo entre as partes.'}

Parágrafo primeiro: O prazo poderá ser prorrogado mediante acordo escrito entre as partes, especialmente nos casos de:
a) solicitação de alterações no escopo pelo CONTRATANTE;
b) atraso no fornecimento de informações ou materiais pelo CONTRATANTE;
c) eventos de força maior ou caso fortuito.

Parágrafo segundo: Eventuais atrasos causados exclusivamente pelo CONTRATANTE não configuram inadimplemento do CONTRATADO.

CLÁUSULA ${numeroParaTexto(clausulaObrigacoesContratante)} - DAS OBRIGAÇÕES DO CONTRATANTE
Constituem obrigações do CONTRATANTE:
a) fornecer todas as informações, dados, materiais e acessos necessários à execução dos serviços, em tempo hábil;
b) efetuar os pagamentos nas datas e condições acordadas;
c) designar responsável para aprovações e comunicações;
d) responder tempestivamente às solicitações do CONTRATADO;
e) aprovar ou solicitar ajustes nas entregas dentro do prazo estipulado.

CLÁUSULA ${numeroParaTexto(clausulaResponsabilidadeConteudo)} - DA RESPONSABILIDADE SOBRE CONTEÚDOS
O CONTRATANTE declara ser o legítimo titular ou possuir autorização para uso de todos os dados, informações, textos, imagens, marcas e demais conteúdos fornecidos ao CONTRATADO para execução dos serviços, responsabilizando-se integralmente por seu uso.

Parágrafo único: O CONTRATANTE isenta o CONTRATADO de qualquer responsabilidade por reclamações, demandas, perdas ou prejuízos decorrentes da utilização dos conteúdos fornecidos.

CLÁUSULA ${numeroParaTexto(clausulaObrigacoesContratado)} - DAS OBRIGAÇÕES DO CONTRATADO  
Constituem obrigações do CONTRATADO:
a) executar os serviços de acordo com as especificações acordadas;
b) manter o CONTRATANTE informado sobre o andamento dos trabalhos;
c) cumprir os prazos estabelecidos, salvo nas hipóteses de prorrogação previstas neste contrato;
d) prestar os esclarecimentos que se fizerem necessários;
e) manter sigilo sobre informações confidenciais do CONTRATANTE.

CLÁUSULA ${numeroParaTexto(clausulaPropriedadeIntelectual)} - DA PROPRIEDADE INTELECTUAL  
Todos os direitos patrimoniais sobre os trabalhos desenvolvidos em razão deste contrato serão transferidos ao CONTRATANTE após a quitação integral do valor contratado.

Parágrafo primeiro: Até a quitação integral, o CONTRATADO manterá a titularidade dos direitos sobre os trabalhos desenvolvidos.

Parágrafo segundo: O CONTRATADO reserva-se o direito de utilizar os trabalhos em seu portfólio profissional, salvo disposição expressa em contrário.

CLÁUSULA ${numeroParaTexto(clausulaConfidencialidade)} - DA CONFIDENCIALIDADE
As partes se comprometem a manter em sigilo todas as informações confidenciais a que tiverem acesso em razão deste contrato, não podendo divulgá-las a terceiros sem autorização prévia e expressa da outra parte.

Parágrafo único: Esta obrigação perdurará mesmo após o término ou rescisão deste contrato, pelo prazo de 2 (dois) anos.

CLÁUSULA ${numeroParaTexto(clausulaProtecaoDados)} - DA PROTEÇÃO DE DADOS
As partes comprometem-se a tratar os dados pessoais a que tiverem acesso em conformidade com a legislação vigente, especialmente a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD).

CLÁUSULA ${numeroParaTexto(clausulaRescisao)} - DA RESCISÃO  
O presente contrato poderá ser rescindido:
a) por acordo mútuo entre as partes, formalizado por escrito;
b) por qualquer das partes, mediante aviso prévio de 15 (quinze) dias, com pagamento proporcional pelos serviços já executados;
c) de imediato, em caso de descumprimento de cláusula contratual, após notificação e prazo de 5 (cinco) dias para regularização.

Parágrafo único: Em caso de rescisão, o CONTRATANTE deverá pagar ao CONTRATADO pelos serviços efetivamente prestados até a data da rescisão.

CLÁUSULA ${numeroParaTexto(clausulaNaoVinculacao)} - DA NÃO VINCULAÇÃO EMPREGATÍCIA  
O presente contrato não gera vínculo empregatício, societário ou de qualquer outra natureza entre as partes, sendo o CONTRATADO profissional autônomo que executa os serviços com independência técnica e operacional.

Parágrafo primeiro: O CONTRATADO poderá prestar serviços a outros clientes durante a vigência deste contrato, não havendo cláusula de exclusividade, salvo se expressamente pactuada.

Parágrafo segundo: Cada parte será responsável pelos seus respectivos encargos fiscais, trabalhistas e previdenciários.

CLÁUSULA ${numeroParaTexto(clausulaResponsabilidade)} - DA LIMITAÇÃO DE RESPONSABILIDADE
A responsabilidade do CONTRATADO limita-se ao valor total deste contrato, excluindo-se expressamente:
a) lucros cessantes;
b) danos indiretos ou consequenciais;
c) perdas decorrentes de decisões comerciais ou estratégicas do CONTRATANTE;
d) danos causados por uso inadequado dos serviços ou entregas.

Parágrafo único: O CONTRATADO não se responsabiliza por falhas, interrupções ou perdas decorrentes de serviços de terceiros, incluindo hospedagem, domínios, APIs externas ou infraestrutura tecnológica não fornecida pelo CONTRATADO.

CLÁUSULA ${numeroParaTexto(clausulaNaoGarantiaResultado)} - DA NÃO GARANTIA DE RESULTADOS
O CONTRATADO compromete-se a empregar os melhores esforços técnicos e profissionais na execução dos serviços, não garantindo resultados financeiros, comerciais, operacionais ou de desempenho específicos.

CLÁUSULA ${numeroParaTexto(clausulaAlteracaoEscopo)} - DA ALTERAÇÃO DE ESCOPO
Qualquer alteração no escopo dos serviços deverá ser formalizada por escrito entre as partes.

Parágrafo primeiro: Alterações de escopo poderão implicar em:
a) ajuste no valor do contrato;
b) ajuste no prazo de entrega;
c) renegociação das condições de pagamento.

Parágrafo segundo: O CONTRATADO não é obrigado a executar serviços fora do escopo originalmente contratado sem a devida formalização e acordo sobre valores e prazos.

CLÁUSULA ${numeroParaTexto(clausulaSuporte)} - DO SUPORTE PÓS-ENTREGA
Após a entrega final dos serviços, o CONTRATADO prestará suporte pelo prazo de ${supportPeriod} dias, limitado à correção de erros diretamente relacionados aos serviços contratados.

Parágrafo único: O suporte não inclui novas funcionalidades, alterações de escopo, melhorias ou demandas não previstas neste contrato.

CLÁUSULA ${numeroParaTexto(clausulaSuspensao)} - DA SUSPENSÃO DOS SERVIÇOS  
O CONTRATADO poderá suspender a execução dos serviços, sem que isso caracterize inadimplemento, nas seguintes hipóteses:
a) atraso superior a 10 (dez) dias no pagamento de qualquer parcela;
b) ausência de fornecimento de informações, materiais ou acessos necessários por prazo superior a 15 (quinze) dias após solicitação;
c) solicitação expressa do CONTRATANTE.

Parágrafo único: A retomada dos serviços ocorrerá em até 5 (cinco) dias úteis após a regularização da pendência que motivou a suspensão, podendo haver ajuste proporcional no prazo de entrega.

CLÁUSULA ${numeroParaTexto(clausulaAceiteEletronico)} - DO ACEITE ELETRÔNICO
As partes reconhecem como válido o aceite eletrônico deste contrato, realizado por meio de plataformas digitais, e-mail, aplicativos de mensagens ou qualquer outro meio eletrônico que permita a identificação das partes e a manifestação inequívoca de vontade.

Parágrafo único: O aceite eletrônico confere ao presente instrumento plena validade jurídica, nos termos da legislação vigente, especialmente a Medida Provisória n. 2.200-2/2001.

CLÁUSULA ${numeroParaTexto(clausulaComunicacoes)} - DAS COMUNICAÇÕES
As comunicações oficiais entre as partes deverão ocorrer por meio de e-mail, plataforma do CONTRATADO ou outro canal formal previamente acordado entre as partes.

CLÁUSULA ${numeroParaTexto(clausulaDisposicoesGerais)} - DAS DISPOSIÇÕES GERAIS  
Parágrafo primeiro: A eventual tolerância de qualquer das partes quanto ao descumprimento de obrigações pela outra não importará em novação, renúncia ou alteração do pactuado.

Parágrafo segundo: Se qualquer cláusula deste contrato for considerada inválida ou inexequível, as demais cláusulas permanecerão em pleno vigor e efeito.

Parágrafo terceiro: Este contrato representa o acordo integral entre as partes sobre seu objeto, substituindo todos os entendimentos anteriores, verbais ou escritos.

Parágrafo quarto: Qualquer alteração deste contrato somente será válida se formalizada por escrito e assinada por ambas as partes.

CLÁUSULA ${numeroParaTexto(clausulaSolucaoAmigavel)} - DA SOLUÇÃO AMIGÁVEL DE CONFLITOS
As partes comprometem-se a buscar solução amigável para eventuais controvérsias decorrentes deste contrato antes do ajuizamento de qualquer ação judicial.

CLÁUSULA ${numeroParaTexto(clausulaForo)} - DO FORO  
As partes elegem o foro da comarca do domicílio do CONTRATADO para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, na presença de duas testemunhas.


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
      toast.error('Usuario não autenticado. Faca login novamente.')
      return
    }

    if (!freelancerId) {
      toast.error('Aguarde o carregamento dos dados do freelancer.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Tentar criar/encontrar cliente automaticamente (opcional)
      console.log('[Contratos] Buscando ou criando cliente...')
      let clienteId: string | null = null
      try {
        clienteId = await findOrCreateClient({
          freelancer_id: freelancerId,
          nome: clientName,
          email: clientEmail || undefined,
          telefone: clientPhone || undefined,
          tipo_pessoa: personType,
          cpf: personType === 'pf' ? clientDocument || undefined : undefined,
          cnpj: personType === 'pj' ? clientDocument || undefined : undefined,
          rg: clientRg || undefined,
          razao_social: clientCompanyName || undefined,
          endereco: clientAddress || undefined,
          cidade: clientCity || undefined,
          estado: clientState || undefined,
        })
        console.log('[Contratos] Cliente ID:', clienteId)
      } catch (clientError) {
        console.warn('[Contratos] Não foi possível criar cliente, continuando sem:', clientError)
      }

      // 2. Payload para o banco
      const contractData = {
        user_id: user.id,
        client_id: clienteId || undefined, // ID do cliente criado/encontrado (ou undefined)
        proposal_id: proposalId || undefined,
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
        deadline_date: deadlineMode === 'date' && deadlineDate ? deadlineDate : undefined,
        payment_type: paymentType,
        payment_installments: installments.length > 0 ? installments : undefined,
        payment_notes: paymentNotes || undefined,
        status,
        contract_text: contractText,
      }

      console.log('[Contratos] Salvando contrato...', editId ? 'UPDATE' : 'INSERT')

      if (editId) {
        await updateContract.mutateAsync({ id: editId, data: contractData })
        toast.success('Contrato atualizado com sucesso')
      } else {
        await createContract.mutateAsync({ freelancerId, data: contractData })
        toast.success('Contrato criado com sucesso')
      }

      navigate('/app/documentos')
    } catch (error) {
      console.error('[Contratos] Erro ao salvar:', error)
      toast.error('Erro ao salvar contrato: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
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
        contract_text: contractText, // Texto completo do contrato para o PDF
      }

      await generatePdf(doc)
      toast.success('PDF gerado com sucesso')
    } catch {
      toast.error('Erro ao gerar PDF')
    }
  }

  // Gerar documento (mostrar preview com feedback)
  const handleGenerate = () => {
    if (!clientName || !serviceName || !value) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    setShowPreview(true)
    toast.success('Preview do contrato gerado! Visualize ao lado.')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          {editId ? 'Editar Contrato' : 'Criar Contrato'}
        </h1>
        <p className="page-subtitle">
          Gere um contrato de servico com clausulas profissionais
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
              onClick={() => setUpgradeModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Assinar Plano Pro
            </Button>
          </div>
        </div>
      )}

      {/* Layout Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-purple-100 p-2">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Status do Contrato
              </CardTitle>
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-blue-100 p-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Contratante
              </CardTitle>
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-amber-100 p-2">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                Servico
              </CardTitle>
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Valor, Prazo e Pagamento
              </CardTitle>
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
                  placeholder="Informações adicionais sobre o pagamento..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botoes */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={handleSave}
              disabled={isLoading || !subscription.canCreateDocuments}
            >
              {isLoading ? (
                <span className="loading-spinner mr-2 h-4 w-4 border-gray-300 border-t-gray-600"></span>
              ) : (
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              className="flex-1 h-11 btn-primary"
              onClick={handleGenerate}
              disabled={!subscription.canCreateDocuments}
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar Documento
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="bg-gradient-to-b from-gray-50 to-gray-100/50 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold text-gray-700">Preview</CardTitle>
              {showPreview && (
                <Button size="sm" variant="outline" onClick={handleDownloadPdf} className="gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar PDF
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 min-h-[600px] shadow-inner max-h-[80vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-gray-800">
                    {contractText}
                  </pre>
                </div>
              ) : (
                <div className="flex min-h-[600px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white p-8">
                  <div className="text-center">
                    <div className="rounded-full bg-gray-100 p-4 mx-auto mb-4 w-fit">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Nenhum preview disponivel</p>
                    <p className="text-xs text-gray-400">
                      Preencha os dados e clique em "Gerar Documento"
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Upgrade */}
      <PlanUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  )
}
