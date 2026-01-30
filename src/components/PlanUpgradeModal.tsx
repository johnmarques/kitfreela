import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStripe } from '@/hooks/useStripe'
import { useSubscription } from '@/hooks/useSubscription'

interface PlanUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PlanUpgradeModal({ open, onOpenChange }: PlanUpgradeModalProps) {
  const { createCheckout, openCustomerPortal, isLoading } = useStripe()
  const subscription = useSubscription()

  // Se ja tem assinatura ativa, mostra opcao de gerenciar
  const hasActiveSubscription = subscription.hasActiveSubscription

  const handleSubscribe = async () => {
    await createCheckout()
  }

  const handleManageSubscription = async () => {
    await openCustomerPortal()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Plano PRO</DialogTitle>
            <Badge className="bg-primary text-white">Recomendado</Badge>
          </div>
          <DialogDescription>
            Desbloqueie todo o potencial do kitFreela
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preco */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              R$ 19,90
              <span className="text-base font-normal text-gray-500">/mes</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Cancele quando quiser</p>
          </div>

          {/* Beneficios */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">O que voce ganha:</p>
            <ul className="space-y-2">
              {[
                'Propostas ilimitadas',
                'Contratos ilimitados',
                'Clientes ilimitados',
                'Perfil publico completo',
                'Controle financeiro avancado',
                'Suporte prioritario',
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Info de pagamento seguro */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-600">
                Pagamento seguro via Stripe. Seus dados estao protegidos.
              </p>
            </div>
          </div>

          {/* Botoes */}
          <div className="space-y-3">
            {hasActiveSubscription ? (
              <>
                {/* Usuario ja tem assinatura - mostra opcao de gerenciar */}
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-2">
                  <p className="text-sm text-green-700 text-center">
                    Voce ja e assinante PRO!
                  </p>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Abrindo...
                    </>
                  ) : (
                    'Gerenciar assinatura'
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Usuario nao tem assinatura - mostra opcao de assinar */}
                <Button
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Redirecionando...
                    </>
                  ) : (
                    'Assinar Plano PRO'
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Continuar no teste gratuito
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
