import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Variaveis de ambiente nao configuradas!',
    '\nVITE_SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTANDO',
    '\nVITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'OK' : 'FALTANDO'
  )
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Helper para verificar se Supabase esta configurado
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
