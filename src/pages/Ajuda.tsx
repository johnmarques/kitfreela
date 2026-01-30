import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Ajuda() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl text-gray-900 brand-logo">
              kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span>
            </h1>
          </Link>
          <Link to="/">
            <Button variant="ghost">Voltar ao inicio</Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Central de Ajuda
          </h1>
          <p className="mb-8 text-gray-600">
            Encontre respostas para suas duvidas sobre o kitFreela
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como criar minha primeira proposta?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Apos fazer login, acesse o menu "Propostas" e clique em "Nova Proposta".
                  Preencha os dados do cliente, servico, valor e prazo. Seus dados profissionais
                  serao preenchidos automaticamente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como gerar um contrato a partir de uma proposta?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Quando uma proposta for aceita pelo cliente, voce pode gerar um contrato
                  automaticamente. Acesse a proposta em "Meus Documentos" e clique em "Gerar Contrato".
                  Os dados serao preenchidos automaticamente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como configuro meu perfil publico?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  No menu lateral, acesse "Perfil Publico". La voce pode configurar sua URL
                  personalizada, adicionar servicos oferecidos e personalizar a aparencia
                  da sua pagina profissional.
                </p>
              </CardContent>
            </Card>

    {/* ISSO AQUI VAMOS ATIVAR DEPOIS
    
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precisa de mais ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Entre em contato conosco pelo email:
                </p>
                <a
                  href="mailto:contato@kitfreela.com.br"
                  className="text-primary hover:underline font-medium"
                >
                  contato@kitfreela.com.br
                </a>
              </CardContent>
            </Card>
    */}
          </div>
        </div>
      </div>
    </div>
  )
}
