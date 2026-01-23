import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/hooks/useSubscription'

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
  const navigate = useNavigate()
  const subscription = useSubscription()
  const showUpgradeCta = subscription.planType !== 'pro' && !subscription.loading

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

        {/* Upgrade CTA */}
        {showUpgradeCta && (
          <div className="mx-4 mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              {subscription.subscriptionStatus === 'trial'
                ? `Teste gratis: ${subscription.daysRemaining} dia${subscription.daysRemaining !== 1 ? 's' : ''}`
                : 'Ative o Plano PRO'}
            </p>
            <button
              onClick={() => {
                navigate('/app/perfil')
                onNavigate?.()
              }}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Ativar Plano PRO
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500">v0.0.0</p>
        </div>
      </div>
    </aside>
  )
}
