import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Termos() {
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
            Termos de Uso
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            Ultima atualizacao: Janeiro de 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceitacao dos Termos</h2>
              <p className="text-gray-600">
                Ao acessar e utilizar o kitFreela, voce concorda com estes Termos de Uso.
                Se voce nao concordar com alguma parte destes termos, nao devera utilizar
                nossos servicos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descricao do Servico</h2>
              <p className="text-gray-600">
                O kitFreela e uma plataforma de gestao profissional para freelancers,
                oferecendo funcionalidades como criacao de propostas comerciais, contratos,
                controle financeiro basico e perfil publico profissional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Conta do Usuario</h2>
              <p className="text-gray-600">
                Para utilizar o kitFreela, voce precisa criar uma conta. Voce e responsavel
                por manter a confidencialidade de sua senha e por todas as atividades
                realizadas em sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Uso Aceitavel</h2>
              <p className="text-gray-600">
                Voce concorda em utilizar o kitFreela apenas para fins legais e de acordo
                com estes termos. E proibido utilizar a plataforma para atividades ilegais,
                fraudulentas ou que violem direitos de terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Propriedade Intelectual</h2>
              <p className="text-gray-600">
                Todo o conteudo do kitFreela, incluindo textos, graficos, logos e software,
                e protegido por direitos autorais. Os documentos criados por voce na
                plataforma sao de sua propriedade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitacao de Responsabilidade</h2>
              <p className="text-gray-600">
                O kitFreela e fornecido "como esta". Nao garantimos que o servico sera
                ininterrupto ou livre de erros. Nao nos responsabilizamos por danos
                indiretos decorrentes do uso da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Alteracoes nos Termos</h2>
              <p className="text-gray-600">
                Podemos atualizar estes Termos de Uso periodicamente. Notificaremos sobre
                alteracoes significativas atraves da plataforma ou por email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contato</h2>
              <p className="text-gray-600">
                Duvidas sobre estes termos podem ser enviadas para:{' '}
                <a
                  href="mailto:contato@kitfreela.com.br"
                  className="text-primary hover:underline"
                >
                  contato@kitfreela.com.br
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
