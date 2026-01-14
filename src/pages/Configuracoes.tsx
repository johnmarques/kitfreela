import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettings, useSaveSettings, UpdateSettingsPayload } from '@/hooks/useSettings'
import { toast } from 'sonner'
import type { ValidityUnit, DateFormat } from '@/types'
import { DEFAULT_USER_SETTINGS } from '@/types'

export default function Configuracoes() {
  const { data: settings, isLoading, error } = useSettings()
  const { mutate: saveSettings, isPending: isSaving } = useSaveSettings()

  // Estado local para o formulario
  const [formData, setFormData] = useState<UpdateSettingsPayload>({
    validade_proposta_padrao: DEFAULT_USER_SETTINGS.validade_proposta_padrao,
    unidade_validade: DEFAULT_USER_SETTINGS.unidade_validade,
    formato_data: DEFAULT_USER_SETTINGS.formato_data,
    auto_save_rascunhos: DEFAULT_USER_SETTINGS.auto_save_rascunhos,
    notif_email: DEFAULT_USER_SETTINGS.notif_email,
    notif_followup: DEFAULT_USER_SETTINGS.notif_followup,
    notif_propostas_expirando: DEFAULT_USER_SETTINGS.notif_propostas_expirando,
    notif_pagamentos_pendentes: DEFAULT_USER_SETTINGS.notif_pagamentos_pendentes,
  })

  // Atualiza o form quando os dados carregam
  useEffect(() => {
    if (settings) {
      setFormData({
        validade_proposta_padrao: settings.validade_proposta_padrao,
        unidade_validade: settings.unidade_validade,
        formato_data: settings.formato_data,
        auto_save_rascunhos: settings.auto_save_rascunhos,
        notif_email: settings.notif_email,
        notif_followup: settings.notif_followup,
        notif_propostas_expirando: settings.notif_propostas_expirando,
        notif_pagamentos_pendentes: settings.notif_pagamentos_pendentes,
      })
    }
  }, [settings])

  // Atualiza campo do formulario
  const updateField = <K extends keyof UpdateSettingsPayload>(
    field: K,
    value: UpdateSettingsPayload[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Salvar configuracoes
  const handleSave = () => {
    saveSettings(formData, {
      onSuccess: () => {
        toast.success('Configuracoes salvas com sucesso!')
      },
      onError: (err) => {
        console.error('Erro ao salvar configuracoes:', err)
        toast.error('Erro ao salvar configuracoes. Tente novamente.')
      },
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando configuracoes...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Erro ao carregar configuracoes</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configuracoes</h1>
        <p className="text-sm text-gray-500">Gerencie as preferencias do sistema</p>
      </div>

      {/* Preferencias de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Preferencias de Documentos
          </CardTitle>
          <p className="text-xs text-gray-500">Configure padroes para propostas e contratos</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prazoValidadeProposta">Prazo de validade padrao (propostas)</Label>
            <div className="flex gap-2">
              <Input
                id="prazoValidadeProposta"
                type="number"
                min="1"
                value={formData.validade_proposta_padrao}
                onChange={(e) =>
                  updateField('validade_proposta_padrao', parseInt(e.target.value) || 1)
                }
                className="w-24"
              />
              <Select
                value={formData.unidade_validade}
                onValueChange={(value: ValidityUnit) => updateField('unidade_validade', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dias">Dias</SelectItem>
                  <SelectItem value="semanas">Semanas</SelectItem>
                  <SelectItem value="meses">Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Tempo que uma proposta permanece valida apos o envio
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formatoData">Formato de data</Label>
            <Select
              value={formData.formato_data}
              onValueChange={(value: DateFormat) => updateField('formato_data', value)}
            >
              <SelectTrigger id="formatoData">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/aaaa">DD/MM/AAAA</SelectItem>
                <SelectItem value="mm/dd/aaaa">MM/DD/AAAA</SelectItem>
                <SelectItem value="aaaa-mm-dd">AAAA-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="salvarRascunhoAuto"
              checked={formData.auto_save_rascunhos}
              onCheckedChange={(checked) =>
                updateField('auto_save_rascunhos', checked === true)
              }
            />
            <div className="space-y-1">
              <label
                htmlFor="salvarRascunhoAuto"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Salvar rascunho automaticamente
              </label>
              <p className="text-xs text-gray-500">
                Salva alteracoes em documentos a cada 30 segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificacoes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Notificacoes
          </CardTitle>
          <p className="text-xs text-gray-500">Escolha como deseja ser notificado</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="notifEmail"
              checked={formData.notif_email}
              onCheckedChange={(checked) => updateField('notif_email', checked === true)}
            />
            <div className="space-y-1">
              <label
                htmlFor="notifEmail"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Notificacoes por e-mail
              </label>
              <p className="text-xs text-gray-500">Receba atualizacoes importantes por e-mail</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="notifFollowup"
              checked={formData.notif_followup}
              onCheckedChange={(checked) => updateField('notif_followup', checked === true)}
            />
            <div className="space-y-1">
              <label
                htmlFor="notifFollowup"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lembrete de follow-up
              </label>
              <p className="text-xs text-gray-500">
                Receba lembretes quando for hora de fazer follow-up com clientes
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="notifPropostaVencendo"
              checked={formData.notif_propostas_expirando}
              onCheckedChange={(checked) =>
                updateField('notif_propostas_expirando', checked === true)
              }
            />
            <div className="space-y-1">
              <label
                htmlFor="notifPropostaVencendo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Propostas vencendo
              </label>
              <p className="text-xs text-gray-500">Alerta quando propostas estao proximas do vencimento</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="notifPagamentoPendente"
              checked={formData.notif_pagamentos_pendentes}
              onCheckedChange={(checked) =>
                updateField('notif_pagamentos_pendentes', checked === true)
              }
            />
            <div className="space-y-1">
              <label
                htmlFor="notifPagamentoPendente"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pagamentos pendentes
              </label>
              <p className="text-xs text-gray-500">Notificacao sobre pagamentos a receber</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seguranca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Seguranca
          </CardTitle>
          <p className="text-xs text-gray-500">Proteja sua conta</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Alterar senha</Label>
            <Input id="senhaAtual" type="password" placeholder="Senha atual" />
          </div>

          <div className="space-y-2">
            <Input id="novaSenha" type="password" placeholder="Nova senha" />
          </div>

          <div className="space-y-2">
            <Input id="confirmarSenha" type="password" placeholder="Confirmar nova senha" />
          </div>

          <Button variant="outline">Alterar Senha</Button>

          <div className="border-t pt-4">
            <div className="flex items-start space-x-3">
              <Checkbox id="autenticacaoDoisFatores" />
              <div className="space-y-1">
                <label
                  htmlFor="autenticacaoDoisFatores"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Autenticacao de dois fatores (em breve)
                </label>
                <p className="text-xs text-gray-500">
                  Adicione uma camada extra de seguranca a sua conta
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados e Privacidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Dados e Privacidade
          </CardTitle>
          <p className="text-xs text-gray-500">Gerencie seus dados</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" className="w-full md:w-auto">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar meus dados
            </Button>
            <p className="mt-2 text-xs text-gray-500">
              Baixe todos os seus dados em formato JSON
            </p>
          </div>

          <div className="border-t pt-4">
            <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 md:w-auto">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Excluir minha conta
            </Button>
            <p className="mt-2 text-xs text-gray-500">
              Esta acao e permanente e nao pode ser desfeita
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sobre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Sobre o KitFreela
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Versao</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ultima atualizacao</span>
            <span className="font-medium">Janeiro 2026</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex gap-3">
              <Button variant="link" className="h-auto p-0 text-sm">
                Termos de Uso
              </Button>
              <Button variant="link" className="h-auto p-0 text-sm">
                Politica de Privacidade
              </Button>
              <Button variant="link" className="h-auto p-0 text-sm">
                Suporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botao Salvar */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar Configuracoes'}
        </Button>
      </div>
    </div>
  )
}
