# Integracao Stripe - KitFreela

## Visao Geral

O KitFreela utiliza Stripe para processar pagamentos do Plano PRO (R$ 19,90/mes).

### Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Edge Functions  │────▶│     Stripe      │
│   (React)       │     │   (Supabase)     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │                       ▼                        │
        │               ┌──────────────────┐             │
        └──────────────▶│    Supabase DB   │◀────────────┘
                        │  (subscriptions) │   (via webhook)
                        └──────────────────┘
```

## Fluxo de Assinatura

1. Usuario clica em "Assinar Plano PRO"
2. Frontend chama Edge Function `create-checkout`
3. Edge Function cria Customer no Stripe (se necessario)
4. Edge Function cria Checkout Session
5. Usuario e redirecionado para pagina do Stripe
6. Apos pagamento, Stripe envia webhook
7. Edge Function `stripe-webhook` processa evento
8. Banco de dados e atualizado
9. Usuario e redirecionado de volta ao app

## Configuracao

### 1. Secrets do Supabase

Configure as seguintes secrets no Supabase Dashboard:

```bash
# Chave secreta do Stripe (sk_live_xxx ou sk_test_xxx)
STRIPE_SECRET_KEY=sk_xxx

# Secret do webhook (whsec_xxx)
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ID do preco do Plano PRO (price_xxx)
STRIPE_PRICE_ID_PRO=price_xxx

# URL do app (para redirects)
APP_URL=https://kitfreela.com.br
```

### 2. Executar Migration

Execute o arquivo `database/migration_stripe_integration.sql` no SQL Editor do Supabase.

### 3. Deploy das Edge Functions

```bash
# Na pasta do projeto
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy customer-portal
```

### 4. Configurar Webhook no Stripe

1. Acesse Stripe Dashboard > Developers > Webhooks
2. Crie um novo endpoint: `https://<seu-projeto>.supabase.co/functions/v1/stripe-webhook`
3. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`
4. Copie o Signing Secret e adicione como `STRIPE_WEBHOOK_SECRET`

### 5. Configurar Customer Portal no Stripe

1. Acesse Stripe Dashboard > Settings > Billing > Customer Portal
2. Ative o portal
3. Configure as opcoes de gerenciamento (cancelar, atualizar cartao, etc.)

## Estrutura de Arquivos

```
supabase/
  functions/
    _shared/
      cors.ts           # Headers CORS compartilhados
    create-checkout/
      index.ts          # Cria sessao de checkout
    stripe-webhook/
      index.ts          # Processa eventos do Stripe
    customer-portal/
      index.ts          # Portal de gerenciamento

src/
  hooks/
    useStripe.ts        # Hook para operacoes Stripe
    useSubscription.ts  # Hook para dados de subscription (atualizado)
  components/
    PlanUpgradeModal.tsx  # Modal de upgrade (atualizado)

database/
  migration_stripe_integration.sql  # Tabelas e funcoes
```

## Tabelas do Banco

### subscriptions

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Chave primaria |
| user_id | UUID | FK para auth.users |
| freelancer_id | UUID | FK para freelancers |
| stripe_customer_id | VARCHAR | ID do cliente no Stripe |
| stripe_subscription_id | VARCHAR | ID da subscription no Stripe |
| status | VARCHAR | Status (active, trialing, canceled, etc.) |
| plan_type | VARCHAR | Tipo do plano (free, pro) |
| current_period_start | TIMESTAMPTZ | Inicio do periodo atual |
| current_period_end | TIMESTAMPTZ | Fim do periodo atual |
| cancel_at_period_end | BOOLEAN | Se vai cancelar no fim do periodo |

### stripe_events

Tabela de auditoria para eventos recebidos do Stripe.

## Estados da Assinatura

| Status | Descricao | Acesso |
|--------|-----------|--------|
| trial | Periodo de teste (7 dias) | Completo |
| active | Assinatura ativa | Completo |
| past_due | Pagamento atrasado | Limitado |
| canceled | Cancelada | Bloqueado |
| expired | Trial expirado | Bloqueado |

## Trial

- Trial de 7 dias controlado localmente (nao no Stripe)
- Campos na tabela `freelancers`: `trial_started_at`, `trial_ends_at`
- Apos trial, usuario deve assinar para continuar usando

## Testes

### Cartoes de Teste

- Sucesso: `4242 4242 4242 4242`
- Requer autenticacao: `4000 0025 0000 3155`
- Recusado: `4000 0000 0000 0002`

### Testar Webhook Localmente

```bash
# Instale o Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Seguranca

- Todas as Edge Functions validam o token JWT do usuario
- Webhook valida a assinatura do Stripe
- RLS ativo em todas as tabelas
- Nunca confia em dados do frontend

## Adicionar Novos Planos

Para adicionar novos planos no futuro:

1. Crie o produto/preco no Stripe
2. Adicione o `price_id` como nova secret
3. Atualize a Edge Function `create-checkout` para aceitar parametro de plano
4. Atualize o frontend para mostrar opcoes de plano

## Troubleshooting

### Checkout nao redireciona

1. Verifique se `STRIPE_SECRET_KEY` esta configurada
2. Verifique se `STRIPE_PRICE_ID_PRO` esta correto
3. Verifique logs da Edge Function

### Webhook nao processa

1. Verifique se `STRIPE_WEBHOOK_SECRET` esta correto
2. Verifique se URL do webhook esta correta no Stripe
3. Verifique logs da Edge Function

### Status nao atualiza

1. Verifique tabela `stripe_events` para erros
2. Verifique se trigger `sync_subscription_to_freelancer` existe
3. Verifique logs do Supabase
