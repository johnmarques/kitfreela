import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Privacidade() {
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
            Politica de Privacidade
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            Ultima atualizacao: Janeiro de 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Informacoes que Coletamos</h2>
              <p className="text-gray-600">
                Coletamos informacoes que voce fornece diretamente, como nome, email,
                dados profissionais e informacoes de clientes para criacao de documentos.
                Tambem coletamos dados de uso automaticamente, como paginas visitadas
                e acoes realizadas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Como Usamos suas Informacoes</h2>
              <p className="text-gray-600">
                Utilizamos suas informacoes para fornecer e melhorar nossos servicos,
                personalizar sua experiencia, processar transacoes, enviar comunicacoes
                importantes e garantir a seguranca da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Compartilhamento de Dados</h2>
              <p className="text-gray-600">
                Nao vendemos suas informacoes pessoais. Podemos compartilhar dados com
                provedores de servicos que nos auxiliam na operacao da plataforma,
                sempre sob acordos de confidencialidade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Seguranca dos Dados</h2>
              <p className="text-gray-600">
                Implementamos medidas de seguranca tecnicas e organizacionais para
                proteger suas informacoes, incluindo criptografia de dados em transito
                e em repouso, controle de acesso e monitoramento continuo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Seus Direitos</h2>
              <p className="text-gray-600">
                Voce tem direito a acessar, corrigir e excluir seus dados pessoais.
                Tambem pode solicitar a exportacao de seus dados. Para exercer esses
                direitos, acesse as configuracoes da sua conta ou entre em contato conosco.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Retencao de Dados</h2>
              <p className="text-gray-600">
                Mantemos seus dados enquanto sua conta estiver ativa. Apos a exclusao
                da conta, seus dados serao removidos em ate 30 dias, exceto quando
                houver obrigacao legal de retencao.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
              <p className="text-gray-600">
                Utilizamos cookies essenciais para o funcionamento da plataforma.
                Cookies analiticos sao utilizados apenas com seu consentimento para
                melhorar nossos servicos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contato</h2>
              <p className="text-gray-600">
                Para questoes sobre privacidade, entre em contato:{' '}
                <a
                  href="mailto:privacidade@kitfreela.com.br"
                  className="text-primary hover:underline"
                >
                  privacidade@kitfreela.com.br
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
