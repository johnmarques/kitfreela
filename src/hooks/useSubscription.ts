import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Tipos para subscription
export type PlanType = 'free' | 'pro'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'blocked'

export interface SubscriptionData {
  planType: PlanType
  subscriptionStatus: SubscriptionStatus
  trialStartedAt: Date | null
  trialEndsAt: Date | null
  daysRemaining: number
  isTrialActive: boolean
  isBlocked: boolean
  canCreateDocuments: boolean
}

const initialData: SubscriptionData = {
  planType: 'free',
  subscriptionStatus: 'trial',
  trialStartedAt: null,
  trialEndsAt: null,
  daysRemaining: 7,
  isTrialActive: true,
  isBlocked: false,
  canCreateDocuments: true,
}

export function useSubscription() {
  const { user } = useAuth()
  const [data, setData] = useState<SubscriptionData>(initialData)
  const [loading, setLoading] = useState(true)

  // Calcula dias restantes do trial
  const calculateDaysRemaining = (trialEndsAt: Date | null): number => {
    if (!trialEndsAt) return 0
    const now = new Date()
    const diff = trialEndsAt.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  // Verifica se trial esta ativo
  const isTrialStillActive = (trialEndsAt: Date | null): boolean => {
    if (!trialEndsAt) return false
    return new Date() < trialEndsAt
  }

  // Carrega dados de subscription
  const loadSubscription = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const { data: freelancer, error } = await supabase
        .from('freelancers')
        .select('plan_type, subscription_status, trial_started_at, trial_ends_at, created_at')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar subscription:', error)
        setLoading(false)
        return
      }

      if (freelancer) {
        // Parse das datas
        const trialStartedAt = freelancer.trial_started_at
          ? new Date(freelancer.trial_started_at)
          : freelancer.created_at
            ? new Date(freelancer.created_at)
            : new Date()

        const trialEndsAt = freelancer.trial_ends_at
          ? new Date(freelancer.trial_ends_at)
          : new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000)

        const daysRemaining = calculateDaysRemaining(trialEndsAt)
        const isTrialActive = isTrialStillActive(trialEndsAt)

        // Determina status real
        const planType: PlanType = (freelancer.plan_type as PlanType) || 'free'
        let subscriptionStatus: SubscriptionStatus = (freelancer.subscription_status as SubscriptionStatus) || 'trial'

        // Se trial expirou e ainda esta como trial, atualiza para expired
        if (subscriptionStatus === 'trial' && !isTrialActive && planType === 'free') {
          subscriptionStatus = 'expired'
        }

        // Define se pode criar documentos
        const canCreateDocuments =
          planType === 'pro' ||
          subscriptionStatus === 'active' ||
          (subscriptionStatus === 'trial' && isTrialActive)

        const isBlocked = subscriptionStatus === 'blocked' || subscriptionStatus === 'expired'

        setData({
          planType,
          subscriptionStatus,
          trialStartedAt,
          trialEndsAt,
          daysRemaining,
          isTrialActive,
          isBlocked,
          canCreateDocuments,
        })
      } else {
        // Usuario novo - inicia trial
        const now = new Date()
        const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        setData({
          planType: 'free',
          subscriptionStatus: 'trial',
          trialStartedAt: now,
          trialEndsAt: trialEnds,
          daysRemaining: 7,
          isTrialActive: true,
          isBlocked: false,
          canCreateDocuments: true,
        })
      }
    } catch (err) {
      console.error('Erro ao carregar subscription:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Inicializa trial para novos usuarios
  const initializeTrial = useCallback(async () => {
    if (!user?.id) return

    const now = new Date()
    const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    try {
      const { error } = await supabase
        .from('freelancers')
        .update({
          plan_type: 'free',
          subscription_status: 'trial',
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEnds.toISOString(),
        })
        .eq('user_id', user.id)

      if (!error) {
        await loadSubscription()
      }
    } catch (err) {
      console.error('Erro ao inicializar trial:', err)
    }
  }, [user?.id, loadSubscription])

  // Carrega ao montar
  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  // Retorna mensagem de status formatada
  const getStatusMessage = (): string => {
    if (data.planType === 'pro' && data.subscriptionStatus === 'active') {
      return 'Plano Pro ativo'
    }

    if (data.subscriptionStatus === 'trial') {
      if (data.daysRemaining === 0) {
        return 'Seu período de teste termina hoje'
      }
      if (data.daysRemaining === 1) {
        return 'Resta 1 dia de teste'
      }
      return `Restam ${data.daysRemaining} dias de teste`
    }

    if (data.subscriptionStatus === 'expired') {
      return 'Período de teste expirado'
    }

    if (data.subscriptionStatus === 'blocked') {
      return 'Conta bloqueada'
    }

    return 'Plano Free'
  }

  // Retorna cor do badge de status
  const getStatusColor = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (data.planType === 'pro' && data.subscriptionStatus === 'active') {
      return 'default'
    }

    if (data.subscriptionStatus === 'trial') {
      if (data.daysRemaining <= 2) {
        return 'destructive'
      }
      return 'secondary'
    }

    if (data.subscriptionStatus === 'expired' || data.subscriptionStatus === 'blocked') {
      return 'destructive'
    }

    return 'outline'
  }

  return {
    ...data,
    loading,
    reload: loadSubscription,
    initializeTrial,
    getStatusMessage,
    getStatusColor,
  }
}
