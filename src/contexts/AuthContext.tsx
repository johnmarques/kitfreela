import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, nome: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; session: Session | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase nao configurado. Autenticacao desabilitada.')
      setLoading(false)
      return
    }

    // Busca sessao inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuta mudancas de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        // NOTA: A criacao do freelancer e gerenciada pelo FreelancerContext
        // de forma bloqueante e confiavel
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Cadastro
  async function signUp(email: string, password: string, nome: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
      },
    })
    return { error }
  }

  // Login
  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error, session: null }
      }

      // Atualiza estado imediatamente
      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
      }

      return { error: null, session: data.session }
    } catch (err) {
      console.error('Erro no signIn:', err)
      return { error: err as AuthError, session: null }
    }
  }

  // Logout
  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  // Recuperar senha
  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
