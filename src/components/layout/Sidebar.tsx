import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/hooks/useSubscription'
import { Radius } from 'lucide-react'

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
  onUpgradeClick?: () => void
}

export default function Sidebar({ onNavigate, onUpgradeClick }: SidebarProps) {
  const subscription = useSubscription()
  const showUpgradeCta = subscription.planType !== 'pro' && !subscription.loading

  return (
    <aside className="h-full w-64  border-gray-200 bg-white">
      <div className="flex h-full flex-col border-gray-200 px-4 md:px-6" style={{ borderRadius: '0px'}}>
        {/* Logo */}
        <div itemID='header-sidebar' className="flex align-center h-16 items-center border-gray-200 border-b py-4 w-full" style={{ borderRadius: '0px'}}>
          <h1 className="text-xl text-gray-900 brand-logo">kit<span style={{ color: 'hsl(164 24% 46%)' }}>Freela</span></h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
          <div className={cn(
            "mx-4 mb-4 rounded-lg border p-3",
            subscription.isBlocked
              ? "border-amber-300 bg-amber-50"
              : "border-primary/20 bg-primary/5"
          )}>
            <p className={cn(
              "text-xs font-medium mb-2",
              subscription.isBlocked ? "text-amber-700" : "text-gray-700"
            )}>
              {subscription.subscriptionStatus === 'trial' && subscription.daysRemaining > 0
                ? `Teste gratis: ${subscription.daysRemaining} dia${subscription.daysRemaining !== 1 ? 's' : ''}`
                : subscription.subscriptionStatus === 'trial' && subscription.daysRemaining === 0
                  ? 'Ultimo dia de teste!'
                  : subscription.isBlocked
                    ? 'Teste encerrado'
                    : 'Ative o Plano PRO'}
            </p>
            <button
              onClick={() => onUpgradeClick?.()}
              className={cn(
                "w-full rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors",
                subscription.isBlocked
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-primary hover:bg-primary/90"
              )}
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
