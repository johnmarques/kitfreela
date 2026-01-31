// Edge Function: test-config
// Testa se as configuracoes estao corretas (APENAS PARA DEBUG)

import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const config = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') ? 'SET' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT SET',
    STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY') ? 'SET' : 'NOT SET',
    STRIPE_SECRET_KEY_PREFIX: Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 10) || 'N/A',
    STRIPE_PRICE_ID_PRO: Deno.env.get('STRIPE_PRICE_ID_PRO') || 'NOT SET',
    STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET') ? 'SET' : 'NOT SET',
    APP_URL: Deno.env.get('APP_URL') || 'NOT SET',
  }

  return new Response(
    JSON.stringify(config, null, 2),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
