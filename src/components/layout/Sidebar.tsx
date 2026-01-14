import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/app', icon: '📊' },
  { name: 'Meus Documentos', path: '/app/documentos', icon: '📄' },
  { name: 'Propostas', path: '/app/propostas', icon: '📝' },
  { name: 'Contratos', path: '/app/contratos', icon: '📋' },
  { name: 'Clientes', path: '/app/clientes', icon: '👥' },
  { name: 'Financeiro', path: '/app/financeiro', icon: '💰' },
  { name: 'Perfil Público', path: '/app/perfil-publico', icon: '🌐' },
  { name: 'Meu Perfil', path: '/app/perfil', icon: '👤' },
  { name: 'Configurações', path: '/app/configuracoes', icon: '⚙️' },
]

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="h-full w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex align-center h-16 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-semibold text-gray-900">Kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span></h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500">v0.0.0</p>
        </div>
      </div>
    </aside>
  )
}
