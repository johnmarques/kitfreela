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

// Traduzir status para português
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    rascunho: 'Rascunho',
    enviada: 'Enviada',
    aceita: 'Aceita',
    encerrada: 'Encerrada',
    expirada: 'Expirada',
    ativo: 'Ativo',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
  }
  return statusMap[status] || status
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

      <!-- Status -->
      <div style="margin-bottom: 30px;">
        <div style="display: inline-block; padding: 6px 12px; background: #dbeafe; color: #1d4ed8; border-radius: 4px; font-size: 12px; font-weight: 500;">
          Status: ${translateStatus(doc.status)}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Documento gerado por KitFreela</p>
      </div>
    </div>
  `
}

// Gerar HTML do contrato
function generateContractHtml(doc: Document): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1f2937;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px; color: #1f2937;">CONTRATO DE PRESTACAO DE SERVICOS</h1>
        <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Data: ${formatDate(doc.created_at)}</p>
      </div>

      <!-- Contratante -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contratante</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 8px;"><strong>Nome:</strong> ${doc.client_name}</p>
          ${doc.client_document ? `<p style="margin: 0 0 8px;"><strong>Documento:</strong> ${doc.client_document}</p>` : ''}
          ${doc.client_address ? `<p style="margin: 0;"><strong>Endereco:</strong> ${doc.client_address}</p>` : ''}
        </div>
      </div>

      <!-- Objeto do Contrato -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Objeto do Contrato</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 8px;"><strong>${doc.service_name || 'Servico nao especificado'}</strong></p>
          ${doc.deliverables ? `<p style="margin: 0; white-space: pre-wrap;">${doc.deliverables}</p>` : ''}
        </div>
      </div>

      <!-- Valores e Prazos -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Valores e Prazos</h2>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="color: #6b7280;">Valor Total:</span>
            <span style="font-size: 20px; font-weight: 600; color: #059669;">${formatCurrency(doc.value)}</span>
          </div>
          ${doc.deadline ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6b7280;">Prazo:</span>
              <span>${doc.deadline}${doc.deadline_type ? ` (${doc.deadline_type})` : ''}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${doc.payment_notes ? `
        <!-- Observacoes de Pagamento -->
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Observacoes de Pagamento</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${doc.payment_notes}</p>
          </div>
        </div>
      ` : ''}

      <!-- Status -->
      <div style="margin-bottom: 30px;">
        <div style="display: inline-block; padding: 6px 12px; background: #dbeafe; color: #1d4ed8; border-radius: 4px; font-size: 12px; font-weight: 500;">
          Status: ${translateStatus(doc.status)}
        </div>
      </div>

      <!-- Assinaturas -->
      <div style="margin-top: 60px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 1px solid #374151; padding-top: 8px;">
            <p style="margin: 0; font-weight: 500;">Contratante</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">${doc.client_name}</p>
          </div>
        </div>
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 1px solid #374151; padding-top: 8px;">
            <p style="margin: 0; font-weight: 500;">Contratado</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Documento gerado por KitFreela</p>
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

  const options = {
    margin: 10,
    filename: `${doc.type === 'proposal' ? 'proposta' : 'contrato'}-${doc.client_name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
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
