// Edge Function: delete-account
// Exclui completamente a conta do usuario (dados + auth.users)
// Requer: SUPABASE_SERVICE_ROLE_KEY configurada como secret

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cria cliente com service_role para ter permissao de admin
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

    // Pega o token JWT do header Authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticacao ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifica o token e pega o usuario
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalido ou usuario nao encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Opcional: Verifica a senha (se enviada no body)
    const body = await req.json().catch(() => ({}))
    if (body.password) {
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: user.email || '',
        password: body.password,
      })

      if (signInError) {
        return new Response(
          JSON.stringify({ error: 'Senha incorreta' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 1. Chama a funcao RPC para deletar os dados do usuario
    const { error: rpcError } = await supabaseAdmin.rpc('prepare_account_deletion')

    if (rpcError) {
      console.error('Erro na funcao RPC:', rpcError)
      // Continua mesmo se a RPC falhar (os dados podem ja ter sido deletados)
    }

    // 2. Deleta o usuario do auth.users usando admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Erro ao deletar usuario do Auth:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir conta: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conta excluida com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro inesperado:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
