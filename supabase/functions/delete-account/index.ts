// Edge Function: delete-account
// Exclui a conta do usuario e cancela assinatura no Stripe
// Processo irreversivel - todos os dados sao apagados

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
    // Cria cliente Supabase com service_role (para operacoes administrativas)
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

    console.log('Iniciando exclusao de conta para user_id:', user.id)

    // 1. Busca dados do freelancer e assinatura
    const { data: freelancer } = await supabaseAdmin
      .from('freelancers')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    // 2. Cancela assinatura no Stripe (se existir)
    if (subscription?.stripe_subscription_id) {
      try {
        console.log('Cancelando assinatura no Stripe:', subscription.stripe_subscription_id)
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
        console.log('Assinatura cancelada com sucesso')
      } catch (stripeError) {
        console.error('Erro ao cancelar assinatura no Stripe:', stripeError)
        // Continua mesmo se falhar - pode ja estar cancelada
      }
    }

    // 3. Deleta o customer no Stripe (se existir)
    if (freelancer?.stripe_customer_id) {
      try {
        console.log('Deletando customer no Stripe:', freelancer.stripe_customer_id)
        await stripe.customers.del(freelancer.stripe_customer_id)
        console.log('Customer deletado com sucesso')
      } catch (stripeError) {
        console.error('Erro ao deletar customer no Stripe:', stripeError)
        // Continua mesmo se falhar
      }
    }

    // 4. Deleta todos os dados do usuario no banco (cascata)
    // A ordem importa devido as foreign keys

    // Deleta registros financeiros
    await supabaseAdmin
      .from('registros_financeiros')
      .delete()
      .eq('freelancer_id', freelancer?.id)

    // Deleta contratos
    await supabaseAdmin
      .from('contratos')
      .delete()
      .eq('freelancer_id', freelancer?.id)

    // Deleta propostas
    await supabaseAdmin
      .from('propostas')
      .delete()
      .eq('freelancer_id', freelancer?.id)

    // Deleta clientes
    await supabaseAdmin
      .from('clientes')
      .delete()
      .eq('freelancer_id', freelancer?.id)

    // Deleta perfil publico
    await supabaseAdmin
      .from('perfis_publicos')
      .delete()
      .eq('freelancer_id', freelancer?.id)

    // Deleta subscriptions
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)

    // Deleta feedbacks
    await supabaseAdmin
      .from('feedbacks')
      .delete()
      .eq('user_id', user.id)

    // Deleta user_settings
    await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)

    // Deleta freelancer
    await supabaseAdmin
      .from('freelancers')
      .delete()
      .eq('user_id', user.id)

    // 5. Deleta o usuario no Supabase Auth
    console.log('Deletando usuario no Auth:', user.id)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Erro ao deletar usuario no Auth:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir conta. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Conta excluida com sucesso:', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conta excluida com sucesso. Todos os dados foram removidos.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro ao excluir conta:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno ao excluir conta' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
