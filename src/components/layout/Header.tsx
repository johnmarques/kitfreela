import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'

// Extrai apenas o primeiro nome do nome completo
function getFirstName(fullName: string): string {
  if (!fullName) return ''
  return fullName.split(' ')[0]
}

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const subscription = useSubscription()

  // Pega o nome completo e extrai apenas o primeiro nome
  const fullName = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuario'
  const userName = getFirstName(fullName)
  const userEmail = user?.email || ''

  // Define o texto do plano baseado na subscription
  const userPlan = subscription.planType === 'pro' ? 'Plano PRO' :
    subscription.subscriptionStatus === 'trial' ? `Teste Grátis (${subscription.daysRemaining} dias)` :
    'Plano Gratuito'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b border-gray-200 bg-white px-4 md:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Avatar fallback={userName} size="sm" />
            <span className="hidden text-sm font-medium text-gray-700 md:inline-block">
              {userName}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
              <p className="text-xs leading-none text-primary mt-1">
                {userPlan}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate('/app/perfil')}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Editar Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate('/app/configuracoes')}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuracoes</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Deslogar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
