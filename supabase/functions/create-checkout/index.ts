// Edge Function: create-checkout
// Cria uma sessao de checkout do Stripe para assinatura PRO
// Requer: STRIPE_SECRET_KEY e STRIPE_PRICE_ID_PRO configuradas como secrets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Busca URL de retorno do body (faz isso no inicio para evitar problemas)
    const body = await req.json().catch(() => ({}))
    const returnUrl = body.return_url || Deno.env.get('APP_URL') || 'https://kitfreela.com.br'
    console.log('returnUrl:', returnUrl)

    // Cria cliente Supabase com service_role
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

    // Valida token JWT do usuario
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticacao ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token recebido (primeiros 20 chars):', token.substring(0, 20))
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'))
    console.log('SERVICE_ROLE_KEY existe:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    console.log('userError:', userError)
    console.log('user:', user?.id)

    if (userError || !user) {
      console.error('Falha na autenticacao:', userError?.message || 'Usuario nulo')
      return new Response(
        JSON.stringify({ error: 'Usuario nao autenticado', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Busca dados do freelancer
    console.log('Buscando freelancer para user_id:', user.id)
    const { data: freelancer, error: freelancerError } = await supabaseAdmin
      .from('freelancers')
      .select('id, nome, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    console.log('freelancer:', freelancer)
    console.log('freelancerError:', freelancerError)

    if (freelancerError || !freelancer) {
      return new Response(
        JSON.stringify({ error: 'Perfil de freelancer nao encontrado', details: freelancerError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifica se ja tem uma subscription ativa
    console.log('Verificando subscription existente...')
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status, stripe_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    console.log('existingSubscription:', existingSubscription)

    if (existingSubscription) {
      return new Response(
        JSON.stringify({ error: 'Voce ja possui uma assinatura ativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cria ou recupera o Stripe Customer
    let stripeCustomerId = freelancer.stripe_customer_id
    console.log('stripe_customer_id existente:', stripeCustomerId)

    if (!stripeCustomerId) {
      console.log('Criando novo customer no Stripe...')
      // Cria novo customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: freelancer.nome || user.email,
        metadata: {
          user_id: user.id,
          freelancer_id: freelancer.id,
        },
      })

      stripeCustomerId = customer.id
      console.log('Customer criado:', stripeCustomerId)

      // Salva o customer_id no Supabase
      await supabaseAdmin
        .from('freelancers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', freelancer.id)
      console.log('Customer salvo no banco')
    }

    // Price ID do plano PRO (configurado como secret)
    const priceId = Deno.env.get('STRIPE_PRICE_ID_PRO')
    console.log('priceId:', priceId)

    if (!priceId) {
      console.error('STRIPE_PRICE_ID_PRO nao configurado')
      return new Response(
        JSON.stringify({ error: 'Configuracao de preco nao encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cria a sessao de checkout
    console.log('Criando sessao de checkout...')
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/app?checkout=canceled`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          freelancer_id: freelancer.id,
        },
      },
      metadata: {
        user_id: user.id,
        freelancer_id: freelancer.id,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'pt-BR',
    })

    // Retorna URL do checkout
    return new Response(
      JSON.stringify({
        url: session.url,
        session_id: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro ao criar checkout:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: 'Erro interno ao criar sessao de pagamento', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
