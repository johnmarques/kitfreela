import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Configuracao do Stripe - Modo Live (Producao)
// URL base do Supabase (usa variavel de ambiente ou fallback)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kprgoxojtzexuclwhotp.supabase.co'

interface UseStripeReturn {
  isLoading: boolean
  createCheckout: () => Promise<void>
  openCustomerPortal: (returnUrl?: string) => Promise<void>
}

export function useStripe(): UseStripeReturn {
  const [isLoading, setIsLoading] = useState(false)

  // Cria sessao de checkout do Stripe
  const createCheckout = useCallback(async () => {
    setIsLoading(true)

    try {
      // Busca sessao atualizada diretamente do Supabase
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !freshSession?.access_token) {
        console.error('Erro ao obter sessao:', sessionError)
        toast.error('Voce precisa estar logado para assinar')
        setIsLoading(false)
        return
      }

      // Debug: mostra info do token
      console.log('Token disponivel:', !!freshSession.access_token)
      console.log('Token (primeiros 50 chars):', freshSession.access_token?.substring(0, 50))
      console.log('User ID:', freshSession.user?.id)

      // Chama a Edge Function create-checkout
      // O price_id e lido das secrets no backend (mais seguro)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.origin,
        }),
      })

      const data = await response.json()
      console.log('Resposta do servidor:', data)

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error
        throw new Error(errorMsg || 'Erro ao criar sessao de pagamento')
      }

      // Redireciona para o checkout do Stripe
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de checkout nao retornada')
      }

    } catch (err) {
      console.error('Erro ao criar checkout:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar pagamento')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Abre o portal do cliente Stripe
  const openCustomerPortal = useCallback(async (returnUrl?: string) => {
    setIsLoading(true)

    try {
      // Busca sessao atualizada diretamente do Supabase
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !freshSession?.access_token) {
        console.error('Erro ao obter sessao:', sessionError)
        toast.error('Voce precisa estar logado')
        setIsLoading(false)
        return
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/customer-portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: returnUrl || window.location.origin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao abrir portal de gerenciamento')
      }

      // Redireciona para o portal do Stripe
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL do portal nao retornada')
      }

    } catch (err) {
      console.error('Erro ao abrir portal:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir gerenciamento')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    createCheckout,
    openCustomerPortal,
  }
}
