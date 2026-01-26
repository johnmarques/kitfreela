import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useSubscription } from '@/hooks/useSubscription'
import PlanUpgradeModal from '@/components/PlanUpgradeModal'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kprgoxojtzexuclwhotp.supabase.co'

// Interface do freelancer conforme tabela REAL no Supabase
// Campos confirmados: id, user_id, nome, email, person_type, cpf, cnpj,
// city, state, whatsapp, professional_email, default_signature, etc.
interface FreelancerProfile {
  nome: string
  email: string
  person_type: 'pf' | 'pj'
  cpf: string
  cnpj: string
  city: string
  state: string
  whatsapp: string
  professional_email: string
  default_signature: string
}

const initialProfile: FreelancerProfile = {
  nome: '',
  email: '',
  person_type: 'pf',
  cpf: '',
  cnpj: '',
  city: '',
  state: '',
  whatsapp: '',
  professional_email: '',
  default_signature: '',
}

export default function Perfil() {
  const navigate = useNavigate()
  const { user, session, signOut } = useAuth()
  const [profile, setProfile] = useState<FreelancerProfile>(initialProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const subscription = useSubscription()

  // Funcao para excluir conta
  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar')
      return
    }

    if (!session?.access_token) {
      toast.error('Voce precisa estar logado')
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir conta')
      }

      toast.success('Conta excluida com sucesso')

      // Faz logout e redireciona
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Erro ao excluir conta:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir conta')
    } finally {
      setDeleting(false)
      setDeleteConfirmText('')
    }
  }

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
            person_type: data.person_type || 'pf',
            cpf: data.cpf || '',
            cnpj: data.cnpj || '',
            city: data.city || '',
            state: data.state || '',
            whatsapp: data.whatsapp || '',
            professional_email: data.professional_email || '',
            default_signature: data.default_signature || '',
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
        person_type: profile.person_type,
        city: profile.city || null,
        state: profile.state || null,
        whatsapp: profile.whatsapp || null,
        professional_email: profile.professional_email || null,
        default_signature: profile.default_signature || null,
        updated_at: new Date().toISOString(),
      }

      // Adiciona campos especificos baseado no tipo de pessoa
      if (profile.person_type === 'pf') {
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

  // Mascara para telefone/WhatsApp: (XX) X XXXX-XXXX
  function formatPhone(value: string): string {
    // Remove tudo que nao for numero
    const numbers = value.replace(/\D/g, '')

    // Aplica a mascara progressivamente
    if (numbers.length <= 2) {
      return numbers.length ? `(${numbers}` : ''
    }
    if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    }
    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`
    }
    if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }
    // Limita a 11 digitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // Handler especifico para WhatsApp com mascara
  function handleWhatsAppChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    updateField('whatsapp', formatted)
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
            value={profile.person_type}
            onValueChange={(value) => updateField('person_type', value)}
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
            {profile.person_type === 'pf' ? 'Dados da pessoa física' : 'Dados da pessoa jurídica'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">
            Estes dados ajudam a preencher documentos automaticamente, economizando tempo.
          </p>

          {/* Campos para Pessoa Física */}
          {profile.person_type === 'pf' && (
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
          {profile.person_type === 'pj' && (
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
                value={profile.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estadoPerfil">Estado</Label>
              <Select
                value={profile.state}
                onValueChange={(value) => updateField('state', value)}
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
              onChange={handleWhatsAppChange}
              maxLength={16}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailProfissional">Email profissional</Label>
            <Input
              id="emailProfissional"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={profile.professional_email}
              onChange={(e) => updateField('professional_email', e.target.value)}
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
            value={profile.default_signature}
            onChange={(e) => updateField('default_signature', e.target.value)}
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
            <Badge
              variant={subscription.getStatusColor()}
              className={
                subscription.subscriptionStatus === 'trial' && subscription.daysRemaining <= 2
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : subscription.subscriptionStatus === 'trial'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : ''
              }
            >
              {subscription.planType === 'pro' ? 'Pro' : 'Free'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">Gerencie seu plano de assinatura</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status do trial */}
          {subscription.subscriptionStatus === 'trial' && (
            <div className={`rounded-lg border p-4 ${
              subscription.daysRemaining <= 2
                ? 'border-red-200 bg-red-50'
                : 'border-primary/20 bg-primary/5'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Periodo de teste</span>
                <span className={`text-sm font-semibold ${
                  subscription.daysRemaining <= 2 ? 'text-red-600' : 'text-primary'
                }`}>
                  {subscription.daysRemaining === 0
                    ? 'Termina hoje!'
                    : subscription.daysRemaining === 1
                      ? '1 dia restante'
                      : `${subscription.daysRemaining} dias restantes`}
                </span>
              </div>
              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all ${
                    subscription.daysRemaining <= 2 ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.max(0, (subscription.daysRemaining / 7) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Aproveite todas as funcionalidades durante o teste gratuito.
              </p>
            </div>
          )}

          {/* Trial expirado */}
          {subscription.subscriptionStatus === 'expired' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium text-red-700">Periodo de teste expirado</span>
              </div>
              <p className="text-xs text-red-600 mb-3">
                Assine o Plano Pro para continuar criando propostas e contratos.
              </p>
            </div>
          )}

          {/* Plano Pro ativo */}
          {subscription.planType === 'pro' && subscription.subscriptionStatus === 'active' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-700">Plano Pro ativo</span>
              </div>
              <p className="text-xs text-green-600">
                Voce tem acesso ilimitado a todas as funcionalidades.
              </p>
            </div>
          )}

          {/* Beneficios do Plano Pro */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Plano Pro</span>
              <span className="text-sm font-semibold text-primary">R$ 19,90/mes</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Propostas e contratos ilimitados</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Clientes ilimitados</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Perfil publico completo</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Controle financeiro avancado</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-600">Suporte prioritario</span>
              </div>
            </div>
          </div>

          {/* Botao de upgrade */}
          {subscription.planType !== 'pro' && (
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => setUpgradeModalOpen(true)}
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Assinar Plano Pro
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Pagamento seguro via Stripe. Cancele quando quiser.
              </p>
            </div>
          )}
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

      {/* Exclusão de Conta */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Excluir Conta
          </CardTitle>
          <p className="text-xs text-gray-500">Encerre permanentemente sua conta</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="font-medium text-red-800 mb-2">Aviso Importante</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Esta acao e <strong>irreversivel</strong></li>
              <li>• Voce perdera <strong>todo o acesso</strong> a plataforma</li>
              <li>• Se voce possui uma assinatura ativa, ela sera <strong>automaticamente cancelada</strong></li>
              <li>• Nao sera possivel recuperar sua conta apos a exclusao</li>
            </ul>
          </div>

          {subscription.hasActiveSubscription && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium text-amber-800">Assinatura Ativa</span>
              </div>
              <p className="text-sm text-amber-700">
                Voce possui uma assinatura ativa do Plano Pro. Ao excluir sua conta, a assinatura
                sera cancelada imediatamente e voce nao sera cobrado novamente.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600">
            Se voce deseja apenas cancelar sua assinatura, a unica forma e excluindo sua conta.
            Apos a exclusao, voce pode criar uma nova conta com o mesmo e-mail, mas todos os
            dados anteriores serao perdidos permanentemente.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir minha conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">Confirmar Exclusao de Conta</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    Esta acao e <strong>irreversivel</strong>. Ao excluir sua conta:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Voce perdera todo o acesso a plataforma</li>
                    <li>Sua assinatura sera cancelada (se houver)</li>
                    <li>Nao sera possivel recuperar a conta</li>
                  </ul>
                  <div className="pt-4">
                    <Label htmlFor="confirmDelete" className="text-sm font-medium">
                      Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar:
                    </Label>
                    <Input
                      id="confirmDelete"
                      className="mt-2"
                      placeholder="EXCLUIR"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                      disabled={deleting}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting} onClick={() => setDeleteConfirmText('')}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'EXCLUIR' || deleting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {deleting ? 'Excluindo...' : 'Excluir Permanentemente'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Modal de Upgrade */}
      <PlanUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  )
}
