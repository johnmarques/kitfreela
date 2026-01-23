import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from '@/components/layout/Layout'
import PrivateRoute from '@/components/PrivateRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import RecuperarSenha from '@/pages/auth/RecuperarSenha'
import RedefinirSenha from '@/pages/auth/RedefinirSenha'
import Dashboard from '@/pages/Dashboard'
import Documentos from '@/pages/Documentos'
import Propostas from '@/pages/Propostas'
import Contratos from '@/pages/Contratos'
import Clientes from '@/pages/Clientes'
import Financeiro from '@/pages/Financeiro'
import PerfilPublico from '@/pages/PerfilPublico'
import Perfil from '@/pages/Perfil'
import Configuracoes from '@/pages/Configuracoes'
import PublicProfileView from '@/pages/PublicProfileView'
import Ajuda from '@/pages/Ajuda'
import Termos from '@/pages/Termos'
import Privacidade from '@/pages/Privacidade'

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Landing Page Publica */}
        <Route path="/" element={<Landing />} />

        {/* Perfil Publico - Vitrine */}
        <Route path="/p/:slug" element={<PublicProfileView />} />

        {/* Autenticacao */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Signup />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        {/* Paginas Institucionais */}
        <Route path="/ajuda" element={<Ajuda />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />

        {/* Area Logada - Protegida */}
        <Route element={<PrivateRoute />}>
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="propostas" element={<Propostas />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="perfil-publico" element={<PerfilPublico />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
