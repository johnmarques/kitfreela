// Edge Function: stripe-webhook
// Recebe e processa eventos do Stripe (webhooks)
// Requer: STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET configuradas como secrets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

// Cliente Supabase com service_role (para operacoes administrativas)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper: Salva evento no banco para auditoria
async function logStripeEvent(event: Stripe.Event, processed: boolean, errorMessage?: string) {
  try {
    await supabaseAdmin.from('stripe_events').upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data,
      processed,
      error_message: errorMessage,
      processed_at: processed ? new Date().toISOString() : null,
    }, {
      onConflict: 'stripe_event_id',
    })
  } catch (err) {
    console.error('Erro ao salvar evento:', err)
  }
}

// Helper: Busca user_id pelo stripe_customer_id
async function getUserIdByCustomerId(customerId: string): Promise<string | null> {
  const { data: freelancer } = await supabaseAdmin
    .from('freelancers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  return freelancer?.user_id || null
}

// Helper: Busca freelancer_id pelo user_id
async function getFreelancerIdByUserId(userId: string): Promise<string | null> {
  const { data: freelancer } = await supabaseAdmin
    .from('freelancers')
    .select('id')
    .eq('user_id', userId)
    .single()

  return freelancer?.id || null
}

// Handler: checkout.session.completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id)

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  // Busca o user_id pelos metadados ou pelo customer
  let userId = session.metadata?.user_id
  let freelancerId = session.metadata?.freelancer_id

  if (!userId) {
    userId = await getUserIdByCustomerId(customerId) ?? undefined
  }

  if (!userId) {
    console.error('User ID nao encontrado para checkout:', session.id)
    return
  }

  if (!freelancerId && userId) {
    freelancerId = await getFreelancerIdByUserId(userId) ?? undefined
  }

  // Busca detalhes da subscription no Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Upsert na tabela subscriptions
  const { error } = await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    freelancer_id: freelancerId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: subscription.items.data[0]?.price.id,
    stripe_product_id: subscription.items.data[0]?.price.product as string,
    status: subscription.status,
    plan_type: 'pro',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    metadata: {
      checkout_session_id: session.id,
    },
  }, {
    onConflict: 'stripe_subscription_id',
  })

  if (error) {
    console.error('Erro ao salvar subscription:', error)
    throw error
  }

  console.log('Subscription criada/atualizada com sucesso:', subscriptionId)
}

// Handler: customer.subscription.created/updated
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log('Processing subscription change:', subscription.id, subscription.status)

  const customerId = subscription.customer as string

  // Busca user_id
  let userId = subscription.metadata?.user_id
  let freelancerId = subscription.metadata?.freelancer_id

  if (!userId) {
    userId = await getUserIdByCustomerId(customerId) ?? undefined
  }

  if (!userId) {
    console.error('User ID nao encontrado para subscription:', subscription.id)
    return
  }

  if (!freelancerId && userId) {
    freelancerId = await getFreelancerIdByUserId(userId) ?? undefined
  }

  // Determina o plan_type baseado no status
  const planType = ['active', 'trialing'].includes(subscription.status) ? 'pro' : 'free'

  // Upsert na tabela subscriptions
  const { error } = await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    freelancer_id: freelancerId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id,
    stripe_product_id: subscription.items.data[0]?.price.product as string,
    status: subscription.status,
    plan_type: planType,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    ended_at: subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  }, {
    onConflict: 'stripe_subscription_id',
  })

  if (error) {
    console.error('Erro ao atualizar subscription:', error)
    throw error
  }

  console.log('Subscription atualizada com sucesso:', subscription.id)
}

// Handler: customer.subscription.deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id)

  // Atualiza o status para canceled
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
      plan_type: 'free',
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Erro ao cancelar subscription:', error)
    throw error
  }

  console.log('Subscription cancelada com sucesso:', subscription.id)
}

// Handler: invoice.payment_failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing payment failed:', invoice.id)

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) return

  // Atualiza o status para past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Erro ao atualizar subscription para past_due:', error)
  }
}

// Main handler
Deno.serve(async (req) => {
  // Webhook nao usa CORS padrao - Stripe envia POST direto
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Le o body raw para verificacao de assinatura
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Assinatura Stripe ausente')
      return new Response('Assinatura ausente', { status: 400 })
    }

    // Verifica a assinatura do webhook
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
      )
    } catch (err) {
      console.error('Erro na verificacao da assinatura:', err)
      return new Response(`Webhook signature verification failed: ${err}`, { status: 400 })
    }

    console.log('Evento recebido:', event.type, event.id)

    // Processa o evento baseado no tipo
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.Invoice)
          break

        case 'invoice.paid':
          // Opcional: pode ser usado para confirmacao adicional
          console.log('Invoice paid:', (event.data.object as Stripe.Invoice).id)
          break

        default:
          console.log('Evento nao tratado:', event.type)
      }

      // Log de sucesso
      await logStripeEvent(event, true)

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

    } catch (handlerError) {
      console.error('Erro ao processar evento:', handlerError)
      await logStripeEvent(event, false, String(handlerError))

      // Retorna 200 mesmo com erro para evitar retries excessivos
      // O erro fica logado na tabela stripe_events
      return new Response(JSON.stringify({ received: true, error: String(handlerError) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

  } catch (err) {
    console.error('Erro geral no webhook:', err)
    return new Response(`Webhook Error: ${err}`, { status: 500 })
  }
})
