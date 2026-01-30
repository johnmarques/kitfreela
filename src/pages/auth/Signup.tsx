import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nome || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (!acceptedTerms) {
      toast.error('Voce precisa aceitar os termos de uso para continuar')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password, nome, { marketingOptIn })

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este e-mail já está cadastrado')
        } else if (error.message.includes('Password should be')) {
          toast.error('A senha deve ter pelo menos 6 caracteres')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('Conta criada com sucesso! Verifique seu e-mail para confirmar.')
      navigate('/login')
    } catch (error) {
      toast.error('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-gray-900 brand-logo">kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span></span>
          </Link>
        </div>

        {/* Card */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Criar sua conta gratuita</h1>
                <p className="mt-2 text-sm text-gray-500">Leva menos de 1 minuto</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome completo */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {/* E-mail */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>

                {/* Confirmar senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>

                {/* Aceitar Termos - Obrigatório */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    disabled={loading}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600 font-normal leading-tight cursor-pointer">
                    Li e aceito os{' '}
                    <Link to="/termos" className="text-gray-900 underline hover:text-gray-700" target="_blank">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link to="/privacidade" className="text-gray-900 underline hover:text-gray-700" target="_blank">
                      Politica de Privacidade
                    </Link>
                  </Label>
                </div>

                {/* Marketing - Opcional */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={marketingOptIn}
                    onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
                    disabled={loading}
                    className="mt-0.5"
                  />
                  <Label htmlFor="marketing" className="text-sm text-gray-500 font-normal leading-tight cursor-pointer">
                    Quero receber novidades e conteudos do kitFreela por e-mail
                  </Label>
                </div>

                {/* Botão */}
                <Button
                  type="submit"
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                  disabled={loading || !acceptedTerms}
                >
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>

                {/* Link para login */}
                <p className="text-center text-sm text-gray-600">
                  Já tem conta?{' '}
                  <Link to="/login" className="text-gray-900 font-medium hover:underline">
                    Entrar
                  </Link>
                </p>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
