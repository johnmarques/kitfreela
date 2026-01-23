import html2pdf from 'html2pdf.js'
import type { Document } from '@/hooks/useDocuments'

// Formatar valor como moeda brasileira
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatar data para exibição
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

// Gerar HTML da proposta
function generateProposalHtml(doc: Document): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1f2937;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #1f2937;">PROPOSTA COMERCIAL</h1>
        <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Data: ${formatDate(doc.created_at)}</p>
      </div>

      <!-- Cliente -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Cliente</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 8px;"><strong>Nome:</strong> ${doc.client_name}</p>
          ${doc.client_email ? `<p style="margin: 0 0 8px;"><strong>E-mail:</strong> ${doc.client_email}</p>` : ''}
          ${doc.client_phone ? `<p style="margin: 0;"><strong>Telefone:</strong> ${doc.client_phone}</p>` : ''}
        </div>
      </div>

      <!-- Serviço -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Serviço</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 8px;"><strong>${doc.service || 'Serviço não especificado'}</strong></p>
          ${doc.scope ? `<p style="margin: 0; white-space: pre-wrap;">${doc.scope}</p>` : ''}
        </div>
      </div>

      <!-- Valores e Prazos -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Investimento</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="color: #6b7280;">Valor Total:</span>
            <span style="font-size: 20px; font-weight: 600; color: #059669;">${formatCurrency(doc.value)}</span>
          </div>
          ${doc.deadline ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="color: #6b7280;">Prazo:</span>
              <span>${doc.deadline}</span>
            </div>
          ` : ''}
          ${doc.payment_method ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6b7280;">Forma de Pagamento:</span>
              <span>${doc.payment_method.toUpperCase()}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Documento gerado por KitFreela</p>
      </div>
    </div>
  `
}

// Processar texto do contrato para HTML formatado
function processContractText(text: string): string {
  // Divide o texto em linhas
  const lines = text.split('\n')
  let html = ''
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Linha vazia - fecha lista se aberta e adiciona espaco
    if (!line) {
      if (inList) {
        html += '</div>'
        inList = false
      }
      continue
    }

    // Titulo principal do contrato (primeira linha geralmente)
    if (line.match(/^CONTRATO DE PRESTA[CÇ][AÃ]O DE SERVI[CÇ]OS?$/i) ||
        line.match(/^CONTRATO$/i)) {
      html += `
        <div style="text-align: center; margin-bottom: 30px; page-break-after: avoid;">
          <h1 style="font-size: 22px; font-weight: 700; color: #1f2937; margin: 0; letter-spacing: 1px;">
            ${line}
          </h1>
        </div>
      `
      continue
    }

    // Clausulas principais (CLAUSULA PRIMEIRA, SEGUNDA, etc.)
    if (line.match(/^CL[AÁ]USULA\s+(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA|SEXTA|S[EÉ]TIMA|OITAVA|NONA|D[EÉ]CIMA|[0-9]+[ªº]?)/i)) {
      if (inList) {
        html += '</div>'
        inList = false
      }
      // Extrai o titulo da clausula (ex: "CLAUSULA PRIMEIRA - DO OBJETO")
      const clausulaMatch = line.match(/^(CL[AÁ]USULA\s+\w+)\s*[-–:]\s*(.+)$/i)
      if (clausulaMatch) {
        html += `
          <div style="margin-top: 28px; margin-bottom: 16px; page-break-inside: avoid; page-break-after: avoid;">
            <h2 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
              ${clausulaMatch[1]}
            </h2>
            <p style="font-size: 13px; font-weight: 600; color: #374151; margin: 4px 0 0; text-transform: uppercase;">
              ${clausulaMatch[2]}
            </p>
          </div>
        `
      } else {
        html += `
          <div style="margin-top: 28px; margin-bottom: 16px; page-break-inside: avoid; page-break-after: avoid;">
            <h2 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
              ${line}
            </h2>
          </div>
        `
      }
      continue
    }

    // Subcláusulas ou parágrafos numerados (1.1, 2.1, etc ou Paragrafo Primeiro)
    if (line.match(/^[0-9]+\.[0-9]+\.?\s/i) ||
        line.match(/^Par[aá]grafo\s+(Primeiro|Segundo|Terceiro|Quarto|Quinto|[Úú]nico)/i)) {
      if (inList) {
        html += '</div>'
        inList = false
      }
      html += `
        <div style="margin: 12px 0; padding-left: 20px; page-break-inside: avoid;">
          <p style="font-size: 13px; line-height: 1.7; color: #374151; margin: 0; text-align: justify;">
            <strong>${line.split(/\s/).slice(0, 2).join(' ')}</strong>${line.split(/\s/).slice(2).join(' ')}
          </p>
        </div>
      `
      continue
    }

    // Itens de lista (a), b), c) ou I), II), III)
    if (line.match(/^[a-z]\)|^[ivxIVX]+\)/)) {
      if (!inList) {
        html += '<div style="margin: 8px 0 8px 30px;">'
        inList = true
      }
      html += `
        <p style="font-size: 13px; line-height: 1.6; color: #4b5563; margin: 6px 0; text-align: justify;">
          ${line}
        </p>
      `
      continue
    }

    // Linha de assinatura ou data/local - alinhadas a esquerda
    if (line.match(/^(Local|Cidade|Data|Fortaleza|São Paulo|Rio de Janeiro)/i) ||
        line.match(/^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i) ||
        line.match(/^_{10,}/) ||
        line.match(/^-{10,}/)) {
      if (inList) {
        html += '</div>'
        inList = false
      }
      html += `
        <div style="margin: 20px 0; page-break-inside: avoid;">
          <p style="font-size: 13px; line-height: 1.6; color: #374151; margin: 0; text-align: left;">
            ${line}
          </p>
        </div>
      `
      continue
    }

    // Bloco de assinatura (CONTRATANTE / CONTRATADO) - alinhado a esquerda
    if (line.match(/^(CONTRATANTE|CONTRATADO|PRESTADOR|TOMADOR)s?:?$/i)) {
      if (inList) {
        html += '</div>'
        inList = false
      }
      html += `
        <div style="margin-top: 40px; max-width: 280px; page-break-inside: avoid;">
          <div style="border-top: 1px solid #374151; padding-top: 10px;">
            <p style="font-size: 12px; font-weight: 600; color: #374151; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
              ${line.replace(/:$/, '')}
            </p>
          </div>
        </div>
      `
      continue
    }

    // Paragrafo normal
    if (inList) {
      html += '</div>'
      inList = false
    }
    html += `
      <div style="margin: 10px 0; page-break-inside: avoid;">
        <p style="font-size: 13px; line-height: 1.7; color: #374151; margin: 0; text-align: justify;">
          ${line}
        </p>
      </div>
    `
  }

  if (inList) {
    html += '</div>'
  }

  return html
}

// Gerar HTML do contrato
function generateContractHtml(doc: Document): string {
  // Se tiver contract_text (texto completo do preview), processa ele
  if (doc.contract_text) {
    const processedContent = processContractText(doc.contract_text)

    return `
      <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 50px 60px; color: #1f2937; background: #fff;">
        <!-- Conteudo do Contrato -->
        <div style="min-height: calc(100% - 60px);">
          ${processedContent}
        </div>

        <!-- Rodape -->
        <div style="border-top: 1px solid #d1d5db; padding-top: 15px; margin-top: 50px; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #9ca3af;">
            Documento gerado por KitFreela • www.kitfreela.com.br
          </p>
        </div>
      </div>
    `
  }

  // Fallback: template simplificado (para contratos antigos sem contract_text)
  return `
    <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 750px; margin: 0 auto; padding: 50px 60px; color: #1f2937; background: #fff;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #374151; padding-bottom: 20px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1f2937; letter-spacing: 1px;">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS
        </h1>
        <p style="margin: 10px 0 0; color: #6b7280; font-size: 12px;">
          Data: ${formatDate(doc.created_at)}
        </p>
      </div>

      <!-- Contratante -->
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          Contratante
        </h2>
        <div style="background: #f9fafb; padding: 16px; border-left: 3px solid #374151;">
          <p style="margin: 0 0 6px; font-size: 13px;"><strong>Nome:</strong> ${doc.client_name}</p>
          ${doc.client_document ? `<p style="margin: 0 0 6px; font-size: 13px;"><strong>Documento:</strong> ${doc.client_document}</p>` : ''}
          ${doc.client_address ? `<p style="margin: 0; font-size: 13px;"><strong>Endereço:</strong> ${doc.client_address}</p>` : ''}
        </div>
      </div>

      <!-- Objeto do Contrato -->
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          Objeto do Contrato
        </h2>
        <div style="background: #f9fafb; padding: 16px; border-left: 3px solid #374151;">
          <p style="margin: 0 0 6px; font-size: 13px;"><strong>${doc.service_name || 'Serviço não especificado'}</strong></p>
          ${doc.deliverables ? `<p style="margin: 0; font-size: 13px; white-space: pre-wrap; line-height: 1.6;">${doc.deliverables}</p>` : ''}
        </div>
      </div>

      <!-- Valores e Prazos -->
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          Valores e Prazos
        </h2>
        <div style="background: #f9fafb; padding: 16px; border-left: 3px solid #374151;">
          <div style="margin-bottom: 10px;">
            <span style="color: #6b7280; font-size: 12px;">Valor Total:</span>
            <span style="font-size: 18px; font-weight: 700; color: #059669; margin-left: 10px;">${formatCurrency(doc.value)}</span>
          </div>
          ${doc.deadline ? `
            <div>
              <span style="color: #6b7280; font-size: 12px;">Prazo:</span>
              <span style="font-size: 14px; margin-left: 10px;">${doc.deadline}${doc.deadline_type ? ` (${doc.deadline_type})` : ''}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${doc.payment_notes ? `
        <!-- Observacoes de Pagamento -->
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            Condições de Pagamento
          </h2>
          <div style="background: #f9fafb; padding: 16px; border-left: 3px solid #374151;">
            <p style="margin: 0; font-size: 13px; white-space: pre-wrap; line-height: 1.6;">${doc.payment_notes}</p>
          </div>
        </div>
      ` : ''}

      <!-- Assinaturas - alinhadas a esquerda -->
      <div style="margin-top: 80px; page-break-inside: avoid;">
        <div style="max-width: 280px;">
          <div style="margin-bottom: 50px;">
            <div style="border-top: 1px solid #374151; padding-top: 10px; margin-top: 50px;">
              <p style="margin: 0; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contratante</p>
              <p style="margin: 6px 0 0; color: #6b7280; font-size: 12px;">${doc.client_name}</p>
            </div>
          </div>
          <div>
            <div style="border-top: 1px solid #374151; padding-top: 10px; margin-top: 50px;">
              <p style="margin: 0; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contratado</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rodape -->
      <div style="border-top: 1px solid #d1d5db; padding-top: 15px; margin-top: 50px; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #9ca3af;">
          Documento gerado por KitFreela • www.kitfreela.com.br
        </p>
      </div>
    </div>
  `
}

// Gerar PDF do documento
export async function generatePdf(doc: Document): Promise<void> {
  const html = doc.type === 'proposal' ? generateProposalHtml(doc) : generateContractHtml(doc)

  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)

  // Configuracoes otimizadas para cada tipo de documento
  const isContract = doc.type === 'contract'

  const options = {
    // Margens: topo, direita, baixo, esquerda (em mm)
    margin: isContract ? [15, 15, 20, 15] : [10, 10, 15, 10],
    filename: `${doc.type === 'proposal' ? 'proposta' : 'contrato'}-${doc.client_name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4',
      orientation: 'portrait' as const,
      compress: true,
    },
    // Configuracoes de quebra de pagina
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'] as ('avoid-all' | 'css' | 'legacy')[],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['div', 'p', 'h1', 'h2', 'h3'],
    },
  }

  try {
    await html2pdf().set(options).from(container).save()
  } finally {
    document.body.removeChild(container)
  }
}

// Gerar HTML para preview (retorna string HTML)
export function getPreviewHtml(doc: Document): string {
  return doc.type === 'proposal' ? generateProposalHtml(doc) : generateContractHtml(doc)
}
