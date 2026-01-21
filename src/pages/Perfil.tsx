import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Interface do freelancer conforme tabela REAL no Supabase
// Campos confirmados: id, user_id, nome, email, tipo_pessoa, cpf, cnpj,
// cidade, estado, whatsapp, email_profissional, assinatura_padrao, etc.
interface FreelancerProfile {
  nome: string
  email: string
  tipo_pessoa: 'pf' | 'pj'
  cpf: string
  cnpj: string
  cidade: string
  estado: string
  whatsapp: string
  email_profissional: string
  assinatura_padrao: string
}

const initialProfile: FreelancerProfile = {
  nome: '',
  email: '',
  tipo_pessoa: 'pf',
  cpf: '',
  cnpj: '',
  cidade: '',
  estado: '',
  whatsapp: '',
  email_profissional: '',
  assinatura_padrao: '',
}

export default function Perfil() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<FreelancerProfile>(initialProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Carrega dados do perfil ao montar o componente
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('freelancers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = not found (ok, usuario novo)
          console.error('Erro ao carregar perfil:', error)
        }

        if (data) {
          setProfile({
            nome: data.nome || '',
            email: data.email || user.email || '',
            tipo_pessoa: data.tipo_pessoa || 'pf',
            cpf: data.cpf || '',
            cnpj: data.cnpj || '',
            cidade: data.cidade || '',
            estado: data.estado || '',
            whatsapp: data.whatsapp || '',
            email_profissional: data.email_profissional || '',
            assinatura_padrao: data.assinatura_padrao || '',
          })
        } else {
          // Usuario novo: preenche com dados do auth
          setProfile({
            ...initialProfile,
            nome: user.user_metadata?.nome || '',
            email: user.email || '',
          })
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // Handler para salvar todas as alteracoes
  async function handleSave() {
    if (!user?.id) {
      toast.error('Usuario nao autenticado')
      return
    }

    setSaving(true)
    try {
      // Monta payload com APENAS campos que existem na tabela
      const payload: Record<string, unknown> = {
        user_id: user.id,
        nome: profile.nome,
        email: profile.email,
        tipo_pessoa: profile.tipo_pessoa,
        cidade: profile.cidade || null,
        estado: profile.estado || null,
        whatsapp: profile.whatsapp || null,
        email_profissional: profile.email_profissional || null,
        assinatura_padrao: profile.assinatura_padrao || null,
        updated_at: new Date().toISOString(),
      }

      // Adiciona campos especificos baseado no tipo de pessoa
      if (profile.tipo_pessoa === 'pf') {
        payload.cpf = profile.cpf || null
        payload.cnpj = null
      } else {
        payload.cnpj = profile.cnpj || null
        payload.cpf = null
      }

      // Upsert: insere se nao existe, atualiza se existe
      const { error } = await supabase
        .from('freelancers')
        .upsert(payload, {
          onConflict: 'user_id',
        })

      if (error) {
        // Log detalhado para debug
        console.error('Erro ao salvar perfil:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        toast.error(`Erro ao salvar: ${error.message}`)
        return
      }

      toast.success('Perfil salvo com sucesso!')
    } catch (err) {
      console.error('Erro inesperado ao salvar perfil:', err)
      toast.error('Erro inesperado ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Helper para atualizar campo do profile
  function updateField(field: keyof FreelancerProfile, value: string) {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6" >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Minha Conta</h1>
        <p className="text-sm text-gray-500">Gerencie suas informações pessoais e profissionais</p>
      </div>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Dados pessoais
          </CardTitle>
          <p className="text-xs text-gray-500">Suas informações básicas de perfil</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={profile.nome}
              onChange={(e) => updateField('nome', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailPerfil">Email</Label>
            <Input
              id="emailPerfil"
              type="email"
              value={profile.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            <p className="text-xs text-gray-500">O email de login não pode ser alterado aqui.</p>
          </div>
        </CardContent>
      </Card>

      {/* Tipo de perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Tipo de perfil
          </CardTitle>
          <p className="text-xs text-gray-500">Selecione como você atua profissionalmente</p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={profile.tipo_pessoa}
            onValueChange={(value) => updateField('tipo_pessoa', value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pf" id="pf" />
              <Label htmlFor="pf" className="font-normal">
                Pessoa Física
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pj" id="pj" />
              <Label htmlFor="pj" className="font-normal">
                Pessoa Jurídica
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Dados fiscais */}
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
            Dados fiscais
          </CardTitle>
          <p className="text-xs text-gray-500">
            {profile.tipo_pessoa === 'pf' ? 'Dados da pessoa física' : 'Dados da pessoa jurídica'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">
            Estes dados ajudam a preencher documentos automaticamente, economizando tempo.
          </p>

          {/* Campos para Pessoa Física */}
          {profile.tipo_pessoa === 'pf' && (
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={profile.cpf}
                onChange={(e) => updateField('cpf', e.target.value)}
              />
            </div>
          )}

          {/* Campos para Pessoa Jurídica */}
          {profile.tipo_pessoa === 'pj' && (
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0001-00"
                value={profile.cnpj}
                onChange={(e) => updateField('cnpj', e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidadePerfil">Cidade</Label>
              <Input
                id="cidadePerfil"
                placeholder="Fortaleza"
                value={profile.cidade}
                onChange={(e) => updateField('cidade', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estadoPerfil">Estado</Label>
              <Select
                value={profile.estado}
                onValueChange={(value) => updateField('estado', value)}
              >
                <SelectTrigger id="estadoPerfil">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                  <SelectItem value="TO">TO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados de contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Dados de contato
          </CardTitle>
          <p className="text-xs text-gray-500">Informações usadas em propostas e contratos</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">
            Estes dados são preenchidos automaticamente nos seus documentos e mensagens.
          </p>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
            <Input
              id="whatsapp"
              placeholder="(85) 9 8224-5233"
              value={profile.whatsapp}
              onChange={(e) => updateField('whatsapp', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailProfissional">Email profissional</Label>
            <Input
              id="emailProfissional"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={profile.email_profissional}
              onChange={(e) => updateField('email_profissional', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assinatura padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Assinatura padrão
          </CardTitle>
          <p className="text-xs text-gray-500">
            Usada automaticamente em propostas, contratos e mensagens
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={profile.assinatura_padrao}
            onChange={(e) => updateField('assinatura_padrao', e.target.value)}
            placeholder="Seu Nome&#10;Sua Profissao&#10;Whatsapp: (00) 0 0000-0000"
            rows={4}
          />
          <p className="text-xs text-gray-500">
            Essa assinatura será incluída automaticamente nos seus documentos.
          </p>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <Button
        size="lg"
        className="w-full md:w-auto"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Salvando...' : 'Salvar todas as alterações'}
      </Button>

      {/* Plano atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <CardTitle className="text-base">Plano e Assinatura</CardTitle>
            </div>
            <Badge variant="outline" className="bg-gray-100">Free</Badge>
          </div>
          <p className="text-xs text-gray-500">Gerencie seu plano de assinatura</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status do plano atual */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Plano Free</span>
              <span className="text-xs text-gray-500">Ativo</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Ate 5 propostas por mes</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Ate 3 contratos por mes</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Perfil publico basico</span>
              </div>
            </div>
          </div>

          {/* Acoes do plano */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              disabled
              title="Em breve"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Assinar plano Premium
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-gray-400"
              disabled
              title="Disponivel apenas para assinantes"
            >
              Cancelar assinatura
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Integracao com pagamento em breve. Aguarde novidades!
          </p>
        </CardContent>
      </Card>

      {/* Notificações */}
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
            Notificações
          </CardTitle>
          <p className="text-xs text-gray-500">Preferências de comunicação</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Configurações de notificação em breve.</p>
        </CardContent>
      </Card>
    </div>
  )
}
