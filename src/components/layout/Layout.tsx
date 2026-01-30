import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import PlanUpgradeModal from '@/components/PlanUpgradeModal'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Menu, X, Lock } from 'lucide-react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const subscription = useSubscription()

  // Verifica se a conta esta bloqueada (trial expirou)
  const isAccountBlocked = !subscription.loading && subscription.isBlocked

  return (
    <div className="flex h-screen bg-white">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          onNavigate={() => setSidebarOpen(false)}
          onUpgradeClick={() => {
            setSidebarOpen(false)
            setUpgradeModalOpen(true)
          }}
        />
      </div>

      {/* Conteudo principal */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header com botao de menu mobile */}
        <div className="flex items-center border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-4 text-gray-600 hover:text-gray-900 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>

        {/* Area de conteudo */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

        {/* Overlay de bloqueio quando trial expira */}
        {isAccountBlocked && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
            <div className="mx-4 max-w-md rounded-xl border border-amber-200 bg-white p-8 shadow-xl text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                Periodo de teste encerrado
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Seu periodo de teste gratuito de 7 dias terminou. Ative o Plano PRO para continuar usando todas as funcionalidades do kitFreela.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => setUpgradeModalOpen(true)}
              >
                Ativar Plano PRO
              </Button>
              <p className="mt-4 text-xs text-gray-500">
                R$ 19,90/mes • Cancele quando quiser
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botao de fechar sidebar mobile (dentro da sidebar) */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed left-56 top-4 z-50 rounded-full bg-white p-1 shadow-md lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {/* Modal de Upgrade */}
      <PlanUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  )
}
