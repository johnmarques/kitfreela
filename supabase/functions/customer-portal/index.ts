// Edge Function: customer-portal
// Cria uma sessao do Stripe Customer Portal para gerenciar assinatura
// Permite: alterar forma de pagamento, cancelar, ver faturas

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
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario nao autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Busca stripe_customer_id do freelancer
    const { data: freelancer, error: freelancerError } = await supabaseAdmin
      .from('freelancers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (freelancerError || !freelancer?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'Cliente Stripe nao encontrado. Voce ainda nao tem uma assinatura.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Busca URL de retorno do body (opcional)
    const body = await req.json().catch(() => ({}))
    const returnUrl = body.return_url || Deno.env.get('APP_URL') || 'https://kitfreela.com.br'

    // Cria a sessao do Customer Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: freelancer.stripe_customer_id,
      return_url: `${returnUrl}/app/perfil`,
    })

    // Retorna URL do portal
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro ao criar sessao do portal:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno ao criar portal de gerenciamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
