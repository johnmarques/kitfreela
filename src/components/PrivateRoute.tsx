import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function PrivateRoute() {
  const { user, loading } = useAuth()

  // Enquanto carrega, mostra loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se nao esta logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se esta logado, renderiza as rotas filhas
  return <Outlet />
}
