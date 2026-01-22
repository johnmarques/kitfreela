import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Landing() {
  // Scroll suave para seção específica
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="sm:hidden">Entrar</Button>
              <Button variant="ghost" className="hidden sm:inline-flex">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="sm:hidden">Comecar</Button>
              <Button className="hidden sm:inline-flex">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 sm:mb-6" variant="outline">
              Feito por freelancer, para freelancers
            </Badge>
            <h1 className="mb-4 text-2xl font-semibold text-gray-900 sm:mb-6 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
             <span style={{ color: 'hsl(164 24% 46%)' }}>Organize seu trabalho</span> de forma simples
            </h1>
            <p className="mb-6 text-base text-gray-600 sm:mb-8 sm:text-lg md:text-xl">
              Propostas profissionais, contratos padronizados e controle financeiro básico.
              Tudo em um so lugar, sem complicação.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/cadastro" className="w-full sm:w-auto shadow-lg">
                <Button size="lg" className="w-full sm:w-auto">
                  Comecar agora - É GRÁTIS
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => scrollToSection('como-funciona')}
              >
                Ver como funciona
              </Button>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-gray-500">Sem cartão de crédito. Sem enrolacao.</p>
          </div>
        </div>
      </section>

      {/* Problemas que Resolve */}
      <section className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 sm:mb-4 sm:text-2xl md:text-3xl">
              Pare de perder tempo com planilhas e documentos desorganizados
            </h2>
            <p className="mb-8 text-base text-gray-600 sm:mb-12 sm:text-lg">
              Problemas reais que voce enfrenta todo dia
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Propostas no Word',
                description: 'Criar propostas sempre do zero, perdendo tempo com formatação e dados repetidos',
              },
              {
                title: 'Clientes perdidos',
                description: 'Esquecer de fazer follow-up e perder oportunidades por falta de organização',
              },
              {
                title: 'Documentos espalhados',
                description: 'Arquivos perdidos em múltiplas pastas, difíceis de encontrar quando precisa',
              },
              {
                title: 'Controle financeiro manual',
                description: 'Planilhas desatualizadas e falta de visão clara do que está a receber',
              },
              {
                title: 'Sem padrão profissional',
                description: 'Documentos com cara de amador, prejudicando sua imagem profissional',
              },
              {
                title: 'Histórico confuso',
                description: 'Não saber o que já foi enviado, aceito ou está pendente com cada cliente',
              },
            ].map((problem, index) => (
              <Card
                key={index}
                className="border border-red-100 bg-gradient-to-br from-red-50/50 to-white transition-all duration-300 hover:shadow-md hover:shadow-red-100 hover:border-red-200"
              >
                <CardContent className="pt-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{problem.title}</h3>
                  <p className="text-sm text-gray-600">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 sm:mb-4 sm:text-2xl md:text-3xl">
              Tudo que você precisa, nada que não precisa
            </h2>
            <p className="mb-8 text-base text-gray-600 sm:mb-12 sm:text-lg">
              Funcionalidades simples e diretas para o dia a dia
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
            {[
              {
                title: 'Propostas profissionais',
                description:
                  'Crie propostas comerciais com preview em tempo real. Seus dados são preenchidos automaticamente.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                ),
              },
              {
                title: 'Contratos a partir de propostas',
                description:
                  'Proposta aceita? Gere o contrato automaticamente com os mesmos dados. Sem retrabalho.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                ),
              },
              {
                title: 'Documentos organizados',
                description:
                  'Tudo em um lugar só. Filtros por cliente, status e data. Histórico completo e rastreável.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                ),
              },
              {
                title: 'Controle financeiro simples',
                description:
                  'Registre manualmente seus recebimentos. Acompanhe o que está pendente. Sem complicação.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ),
              },
              {
                title: 'Follow-up organizado',
                description:
                  'Defina lembretes para cada proposta. Nunca mais perca um cliente por esquecimento.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                ),
              },
              {
                title: 'Perfil público',
                description:
                  'Tenha uma página profissional para compartilhar com potenciais clientes. Simples e direto.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                ),
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group cursor-default transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    <svg
                      className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 sm:mb-4 sm:text-2xl md:text-3xl">Como funciona</h2>
            <p className="mb-8 text-base text-gray-600 sm:mb-12 sm:text-lg">Comece em minutos, nao em horas</p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="space-y-6 sm:space-y-8">
              {[
                {
                  step: '1',
                  title: 'Cadastre seus dados',
                  description:
                    'Preencha uma única vez suas informações profissionais e assinatura padrão',
                },
                {
                  step: '2',
                  title: 'Crie sua primeira proposta',
                  description:
                    'Seus dados já estarão lá. Só adicionar as informações do projeto e cliente',
                },
                {
                  step: '3',
                  title: 'Gere o documento',
                  description: 'Preview, ajustes se necessário, e documento pronto para enviar',
                },
                {
                  step: '4',
                  title: 'Acompanhe tudo',
                  description:
                    'Status, follow-ups e histórico. Tudo organizado em um lugar só',
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <span className="text-lg font-semibold">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="cta-final" className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 sm:mb-4 sm:text-2xl md:text-3xl">
              Pare de perder tempo com planilhas
            </h2>
            <p className="mb-6 text-base text-gray-600 sm:mb-8 sm:text-lg">
              Comece a organizar seu trabalho hoje. Grátis para começar.
            </p>
            <Link to="/cadastro" className='shadow-lg'>
              <Button size="lg" className="w-full sm:w-auto">Criar minha conta gratis</Button>
            </Link>
            <p className="mt-4 text-xs sm:text-sm text-gray-500">Sem cartão de crédito. Configure em minutos.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 sm:gap-10 grid-cols-2 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-semibold text-gray-900">
                Kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span>
              </h3>
              <p className="text-sm text-gray-600">
                Gestão profissional para freelancers solo
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-gray-900">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <button
                    onClick={() => scrollToSection('funcionalidades')}
                    className="hover:text-gray-900 transition-colors"
                  >
                    Funcionalidades
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('cta-final')}
                    className="hover:text-gray-900 transition-colors"
                  >
                    Preços
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-gray-900">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link to="/ajuda" className="hover:text-gray-900 transition-colors">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contato@kitfreela.com.br"
                    className="hover:text-gray-900 transition-colors"
                  >
                    Contato
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-gray-900">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link to="/termos" className="hover:text-gray-900 transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link to="/privacidade" className="hover:text-gray-900 transition-colors">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-500">© 2026 KitFreela. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
