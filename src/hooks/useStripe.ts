import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

// Configuracao do Stripe - Modo Teste
// URL base do Supabase (usa variavel de ambiente ou fallback)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kprgoxojtzexuclwhotp.supabase.co'

interface UseStripeReturn {
  isLoading: boolean
  createCheckout: () => Promise<void>
  openCustomerPortal: (returnUrl?: string) => Promise<void>
}

export function useStripe(): UseStripeReturn {
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Cria sessao de checkout do Stripe
  const createCheckout = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Voce precisa estar logado para assinar')
      return
    }

    setIsLoading(true)

    try {
      // Chama a Edge Function create-checkout
      // O price_id e lido das secrets no backend (mais seguro)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.origin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessao de pagamento')
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
  }, [session?.access_token])

  // Abre o portal do cliente Stripe
  const openCustomerPortal = useCallback(async (returnUrl?: string) => {
    if (!session?.access_token) {
      toast.error('Voce precisa estar logado')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/customer-portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
  }, [session?.access_token])

  return {
    isLoading,
    createCheckout,
    openCustomerPortal,
  }
}
