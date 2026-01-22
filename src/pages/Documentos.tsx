import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DocumentViewModal } from '@/components/documents/DocumentViewModal'
import {
  useDocuments,
  useDeleteDocument,
  useDuplicateDocument,
  type Document,
} from '@/hooks/useDocuments'
import { generatePdf } from '@/lib/pdf'
import { useSettingsContext } from '@/contexts/SettingsContext'

// Formatar valor como moeda brasileira
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Traduzir status para portugues
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

// Cor do badge baseado no status
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    rascunho: 'bg-gray-100 text-gray-700',
    enviada: 'bg-blue-50 text-blue-700',
    aceita: 'bg-green-50 text-green-700',
    encerrada: 'bg-purple-50 text-purple-700',
    expirada: 'bg-red-50 text-red-700',
    ativo: 'bg-green-50 text-green-700',
    finalizado: 'bg-purple-50 text-purple-700',
    cancelado: 'bg-red-50 text-red-700',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-700'
}

export default function Documentos() {
  const navigate = useNavigate()
  const { formatDate } = useSettingsContext()
  const { data: documents = [], isLoading } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const duplicateDocument = useDuplicateDocument()

  // Filtros
  const [filterType, setFilterType] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterClient, setFilterClient] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Modal de visualizacao
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  // Modal de confirmacao de exclusao
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  // Status disponiveis baseado no tipo selecionado
  const availableStatuses = useMemo(() => {
    if (filterType === 'proposal') {
      return [
        { value: 'todos', label: 'Todos' },
        { value: 'rascunho', label: 'Rascunho' },
        { value: 'enviada', label: 'Enviada' },
        { value: 'aceita', label: 'Aceita' },
        { value: 'encerrada', label: 'Encerrada' },
        { value: 'expirada', label: 'Expirada' },
      ]
    } else if (filterType === 'contract') {
      return [
        { value: 'todos', label: 'Todos' },
        { value: 'rascunho', label: 'Rascunho' },
        { value: 'ativo', label: 'Ativo' },
        { value: 'finalizado', label: 'Finalizado' },
        { value: 'cancelado', label: 'Cancelado' },
      ]
    }
    return [
      { value: 'todos', label: 'Todos' },
      { value: 'rascunho', label: 'Rascunho' },
      { value: 'enviada', label: 'Enviada' },
      { value: 'aceita', label: 'Aceita' },
      { value: 'encerrada', label: 'Encerrada' },
      { value: 'expirada', label: 'Expirada' },
      { value: 'ativo', label: 'Ativo' },
      { value: 'finalizado', label: 'Finalizado' },
      { value: 'cancelado', label: 'Cancelado' },
    ]
  }, [filterType])

  // Documentos filtrados
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Filtro por tipo
      if (filterType !== 'todos' && doc.type !== filterType) {
        return false
      }

      // Filtro por status
      if (filterStatus !== 'todos' && doc.status !== filterStatus) {
        return false
      }

      // Filtro por cliente (busca parcial, case insensitive)
      if (filterClient && !doc.client_name.toLowerCase().includes(filterClient.toLowerCase())) {
        return false
      }

      // Filtro por data de criacao
      if (filterDate) {
        const docDate = new Date(doc.created_at).toISOString().split('T')[0]
        if (docDate !== filterDate) {
          return false
        }
      }

      return true
    })
  }, [documents, filterType, filterStatus, filterClient, filterDate])

  // Reset filtro de status quando tipo muda
  const handleTypeChange = (value: string) => {
    setFilterType(value)
    setFilterStatus('todos')
  }

  // Handlers
  const handleView = (doc: Document) => {
    setSelectedDocument(doc)
    setViewModalOpen(true)
  }

  const handleEdit = (doc: Document) => {
    if (doc.type === 'proposal') {
      navigate(`/app/propostas?id=${doc.id}`)
    } else {
      navigate(`/app/contratos?id=${doc.id}`)
    }
  }

  const handleDuplicate = async (doc: Document) => {
    try {
      await duplicateDocument.mutateAsync({ id: doc.id, type: doc.type })
      toast.success('Documento duplicado com sucesso')
    } catch {
      toast.error('Erro ao duplicar documento')
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      await generatePdf(doc)
      toast.success('PDF gerado com sucesso')
    } catch {
      toast.error('Erro ao gerar PDF')
    }
  }

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    try {
      await deleteDocument.mutateAsync({ id: documentToDelete.id, type: documentToDelete.type })
      toast.success('Documento excluido com sucesso')
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
    } catch {
      toast.error('Erro ao excluir documento')
    }
  }

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Meus Documentos</h1>
        <p className="page-subtitle">Gerencie suas propostas e contratos</p>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-gray-100 p-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Filtros</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Tipo</label>
                <Select value={filterType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="proposal">Proposta</SelectItem>
                    <SelectItem value="contract">Contrato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Buscar por cliente */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Buscar por cliente</label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    placeholder="Nome do cliente..."
                    className="pl-9"
                    value={filterClient}
                    onChange={(e) => setFilterClient(e.target.value)}
                  />
                </div>
              </div>

              {/* Data de criacao */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Data de criacao</label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="loading-spinner w-4 h-4 border-gray-300 border-t-primary"></span>
              Carregando...
            </span>
          ) : (
            `${filteredDocuments.length} documento${filteredDocuments.length !== 1 ? 's' : ''} encontrado${filteredDocuments.length !== 1 ? 's' : ''}`
          )}
        </p>
      </div>

      {/* Lista de Documentos */}
      <div className="space-y-3">
        {filteredDocuments.map((doc, index) => (
          <Card
            key={doc.id}
            className="card-hover border border-gray-100 shadow-sm animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 sm:items-center">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  {/* Icone - escondido em mobile muito pequeno */}
                  <div className={`hidden rounded-lg p-2.5 sm:block ${doc.type === 'proposal' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                    <svg className={`h-5 w-5 ${doc.type === 'proposal' ? 'text-blue-500' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Informacoes */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`text-xs font-medium ${doc.type === 'proposal' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {doc.type === 'proposal' ? 'Proposta' : 'Contrato'}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{doc.title}</h3>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`status-badge ${getStatusColor(doc.status)}`}>
                        {translateStatus(doc.status)}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(doc.value)}</span>
                    </div>
                  </div>
                </div>

                {/* Menu de acoes */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(doc)}>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(doc)}>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(doc)}>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(doc)}>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(doc)}
                      className="text-red-600"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && filteredDocuments.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="empty-state py-16">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <svg className="empty-state-icon w-10 h-10 text-gray-400 !mb-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="empty-state-title">Nenhum documento encontrado</h3>
            <p className="empty-state-description mb-5">
              {documents.length === 0
                ? 'Crie sua primeira proposta para comecar a organizar seus documentos'
                : 'Tente ajustar os filtros para encontrar o que procura'}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => navigate('/app/propostas')} className="btn-primary">
                Criar Proposta
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Visualizacao */}
      <DocumentViewModal
        document={selectedDocument}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
      />

      {/* Modal de Confirmacao de Exclusao */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este documento? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
