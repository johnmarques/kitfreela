import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from '@/components/layout/Layout'
import PrivateRoute from '@/components/PrivateRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import RecuperarSenha from '@/pages/auth/RecuperarSenha'
import Dashboard from '@/pages/Dashboard'
import Documentos from '@/pages/Documentos'
import Propostas from '@/pages/Propostas'
import Contratos from '@/pages/Contratos'
import Clientes from '@/pages/Clientes'
import Financeiro from '@/pages/Financeiro'
import PerfilPublico from '@/pages/PerfilPublico'
import Perfil from '@/pages/Perfil'
import Configuracoes from '@/pages/Configuracoes'

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Landing Page Publica */}
        <Route path="/" element={<Landing />} />

        {/* Autenticacao */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Signup />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />

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
