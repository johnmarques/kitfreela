import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { Menu, X } from 'lucide-react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Conteudo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
    </div>
  )
}
