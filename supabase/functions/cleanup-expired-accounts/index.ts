// Edge Function: cleanup-expired-accounts
// Exclui automaticamente contas bloqueadas ha mais de 60 dias
// Deve ser chamada via cron job diario

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const DAYS_UNTIL_DELETE = 60

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Valida secret key para seguranca (evita chamadas nao autorizadas)
    const authHeader = req.headers.get('Authorization')
    const expectedKey = Deno.env.get('CRON_SECRET_KEY')

    // Se CRON_SECRET_KEY estiver configurado, valida
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return new Response(
        JSON.stringify({ error: 'Nao autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    console.log('Iniciando limpeza de contas expiradas...')

    // Busca contas bloqueadas ha mais de 60 dias
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_UNTIL_DELETE)

    const { data: expiredAccounts, error: fetchError } = await supabaseAdmin
      .from('freelancers')
      .select('id, user_id, stripe_customer_id, blocked_at')
      .not('blocked_at', 'is', null)
      .lt('blocked_at', cutoffDate.toISOString())
      .in('subscription_status', ['expired', 'blocked'])
      .eq('plan_type', 'free')

    if (fetchError) {
      console.error('Erro ao buscar contas expiradas:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar contas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!expiredAccounts || expiredAccounts.length === 0) {
      console.log('Nenhuma conta para excluir')
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: 'Nenhuma conta para excluir' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Encontradas ${expiredAccounts.length} contas para excluir`)

    let deletedCount = 0
    const errors: string[] = []

    for (const account of expiredAccounts) {
      try {
        console.log(`Excluindo conta: user_id=${account.user_id}, freelancer_id=${account.id}`)

        // 1. Busca subscription ativa (se houver)
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('stripe_subscription_id')
          .eq('user_id', account.user_id)
          .in('status', ['active', 'trialing'])
          .single()

        // 2. Cancela assinatura no Stripe (se existir)
        if (subscription?.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
            console.log('Assinatura Stripe cancelada')
          } catch (stripeError) {
            console.warn('Erro ao cancelar assinatura Stripe:', stripeError)
          }
        }

        // 3. Deleta customer no Stripe (se existir)
        if (account.stripe_customer_id) {
          try {
            await stripe.customers.del(account.stripe_customer_id)
            console.log('Customer Stripe deletado')
          } catch (stripeError) {
            console.warn('Erro ao deletar customer Stripe:', stripeError)
          }
        }

        // 4. Deleta dados do banco (ordem importa por foreign keys)
        await supabaseAdmin.from('registros_financeiros').delete().eq('freelancer_id', account.id)
        await supabaseAdmin.from('contratos').delete().eq('freelancer_id', account.id)
        await supabaseAdmin.from('propostas').delete().eq('freelancer_id', account.id)
        await supabaseAdmin.from('clientes').delete().eq('freelancer_id', account.id)
        await supabaseAdmin.from('perfis_publicos').delete().eq('freelancer_id', account.id)
        await supabaseAdmin.from('subscriptions').delete().eq('user_id', account.user_id)
        await supabaseAdmin.from('feedbacks').delete().eq('user_id', account.user_id)
        await supabaseAdmin.from('user_settings').delete().eq('user_id', account.user_id)
        await supabaseAdmin.from('freelancers').delete().eq('id', account.id)

        // 5. Deleta usuario no Auth
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(account.user_id)

        if (deleteAuthError) {
          console.error('Erro ao deletar usuario no Auth:', deleteAuthError)
          errors.push(`user_id=${account.user_id}: erro no Auth`)
        } else {
          deletedCount++
          console.log(`Conta excluida com sucesso: user_id=${account.user_id}`)
        }

      } catch (accountError) {
        console.error(`Erro ao excluir conta ${account.id}:`, accountError)
        errors.push(`freelancer_id=${account.id}: ${accountError}`)
      }
    }

    console.log(`Limpeza concluida: ${deletedCount} contas excluidas`)

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        total: expiredAccounts.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `${deletedCount} de ${expiredAccounts.length} contas excluidas`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro na limpeza de contas:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
