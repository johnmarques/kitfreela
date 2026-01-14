import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Document } from '@/hooks/useDocuments'
import {
  useUpdateDocumentStatus,
  useUpdateFollowup,
} from '@/hooks/useDocuments'
import { generatePdf, getPreviewHtml } from '@/lib/pdf'
import type { ProposalStatus, ContractStatus } from '@/types'

interface DocumentViewModalProps {
  document: Document | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PROPOSAL_STATUSES: { value: ProposalStatus; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aceita', label: 'Aceita' },
  { value: 'encerrada', label: 'Encerrada' },
  { value: 'expirada', label: 'Expirada' },
]

const CONTRACT_STATUSES: { value: ContractStatus; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const FOLLOWUP_CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
]

export function DocumentViewModal({ document, open, onOpenChange }: DocumentViewModalProps) {
  const navigate = useNavigate()
  const updateStatus = useUpdateDocumentStatus()
  const updateFollowup = useUpdateFollowup()

  const [status, setStatus] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [followupChannel, setFollowupChannel] = useState('')

  // Atualiza estado local quando documento muda
  useEffect(() => {
    if (document) {
      setStatus(document.status)
      setFollowupDate(document.followup_date || '')
      setFollowupChannel(document.followup_channel || '')
    }
  }, [document])

  if (!document) return null

  const statuses = document.type === 'proposal' ? PROPOSAL_STATUSES : CONTRACT_STATUSES
  const isProposal = document.type === 'proposal'
  const isAccepted = document.status === 'aceita'

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      await updateStatus.mutateAsync({
        id: document.id,
        type: document.type,
        status: newStatus,
      })
      toast.success('Status atualizado com sucesso')
    } catch {
      toast.error('Erro ao atualizar status')
      setStatus(document.status)
    }
  }

  const handleFollowupChange = async () => {
    if (!isProposal) return

    try {
      await updateFollowup.mutateAsync({
        id: document.id,
        followup_date: followupDate || undefined,
        followup_channel: followupChannel || undefined,
      })
      toast.success('Follow-up atualizado com sucesso')
    } catch {
      toast.error('Erro ao atualizar follow-up')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      await generatePdf(document)
      toast.success('PDF gerado com sucesso')
    } catch {
      toast.error('Erro ao gerar PDF')
    }
  }

  const handleGenerateContract = () => {
    if (!isProposal || !isAccepted) return

    onOpenChange(false)
    navigate(`/app/contratos?proposal=${document.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isProposal ? 'Proposta' : 'Contrato'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Preview do documento */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-white p-4 min-h-[400px]">
              <div
                dangerouslySetInnerHTML={{ __html: getPreviewHtml(document) }}
                className="text-sm"
              />
            </div>
          </div>

          {/* Painel lateral */}
          <div className="space-y-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Follow-up (apenas para propostas) */}
            {isProposal && (
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-sm font-medium">Follow-up</h3>

                <div className="space-y-2">
                  <Label htmlFor="followupDate">Data</Label>
                  <Input
                    id="followupDate"
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    onBlur={handleFollowupChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followupChannel">Canal</Label>
                  <Select value={followupChannel} onValueChange={(v) => {
                    setFollowupChannel(v)
                    // Trigger update after setting state
                    setTimeout(() => handleFollowupChange(), 0)
                  }}>
                    <SelectTrigger id="followupChannel">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLLOWUP_CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Acoes */}
            <div className="space-y-2">
              <Button onClick={handleDownloadPdf} variant="outline" className="w-full">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar PDF
              </Button>

              {isProposal && isAccepted && (
                <Button
                  onClick={handleGenerateContract}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Gerar Contrato
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
