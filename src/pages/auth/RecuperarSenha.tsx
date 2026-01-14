import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function RecuperarSenha() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email) {
      toast.error('Digite seu e-mail')
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        toast.error(error.message)
        return
      }

      setEnviado(true)
      toast.success('E-mail de recuperação enviado!')
    } catch (error) {
      toast.error('Erro ao enviar e-mail. Tente novamente.')
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
            <span className="text-xl font-semibold text-gray-900">Kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span></span>
          </Link>
        </div>

        {/* Card */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Recuperar senha</h1>
                <p className="mt-2 text-sm text-gray-500">
                  {enviado
                    ? 'Verifique sua caixa de entrada'
                    : 'Digite seu e-mail e enviaremos um link para redefinir sua senha'
                  }
                </p>
              </div>

              {enviado ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <p className="text-sm text-green-800">
                      Enviamos um e-mail para <strong>{email}</strong> com instruções para redefinir sua senha.
                    </p>
                  </div>
                  <p className="text-center text-sm">
                    <Link to="/login" className="text-gray-900 font-medium hover:underline">
                      Voltar para login
                    </Link>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {/* Botão */}
                  <Button
                    type="submit"
                    className="w-full bg-gray-900 text-white hover:bg-gray-800"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </Button>

                  {/* Link para voltar */}
                  <p className="text-center text-sm">
                    <Link to="/login" className="text-gray-900 font-medium hover:underline">
                      Voltar para login
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
