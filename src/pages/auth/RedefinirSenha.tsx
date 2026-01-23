import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function RedefinirSenha() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verifica se chegou com um token de recuperacao valido
  useEffect(() => {
    // O Supabase automaticamente processa o token da URL e cria uma sessao temporaria
    // Verificamos se existe uma sessao ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Link invalido ou expirado. Solicite um novo link de recuperacao.')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error('Erro ao redefinir senha:', error)
        toast.error(error.message)
        return
      }

      setSuccess(true)
      toast.success('Senha redefinida com sucesso!')

      // Redireciona para o app apos 2 segundos
      setTimeout(() => {
        navigate('/app', { replace: true })
      }, 2000)
    } catch (err) {
      console.error('Erro inesperado:', err)
      toast.error('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Se houver erro no token
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold text-gray-900">Kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span></span>
            </Link>
          </div>

          {/* Card */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900">Link invalido</h1>
                  <p className="mt-2 text-sm text-gray-500">{error}</p>
                </div>

                <div className="space-y-3">
                  <Link to="/recuperar-senha">
                    <Button className="w-full">Solicitar novo link</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">Voltar para login</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-gray-900">Kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span></span>
          </Link>
        </div>

        {/* Card */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                {success ? (
                  <>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Senha redefinida!</h1>
                    <p className="mt-2 text-sm text-gray-500">Voce sera redirecionado automaticamente...</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-semibold text-gray-900">Nova senha</h1>
                    <p className="mt-2 text-sm text-gray-500">Digite sua nova senha abaixo</p>
                  </>
                )}
              </div>

              {!success && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nova Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Confirmar Senha */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Digite novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Botao */}
                  <Button
                    type="submit"
                    className="w-full bg-gray-900 text-white hover:bg-gray-800"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Salvar nova senha'}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
