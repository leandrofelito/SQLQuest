/**
 * Helpers para simular eventos do Stripe nos testes E2E.
 *
 * A assinatura do webhook Stripe usa HMAC-SHA256:
 *   payload_assinado = `{timestamp}.{body}`
 *   signature = hmac(key=STRIPE_WEBHOOK_SECRET, payload_assinado)
 *   header = `t={timestamp},v1={signature}`
 *
 * Não depende do SDK da Stripe — usa apenas o módulo `crypto` do Node.
 */
import { createHmac } from 'crypto'

export const TEST_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_e2e_secret_for_testing_only'

// ---------------------------------------------------------------------------
// Geração de assinatura (mesma lógica do stripe.webhooks.constructEvent)
// ---------------------------------------------------------------------------
export function generateStripeSignature(rawBody: string, secret: string = TEST_WEBHOOK_SECRET): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signed = `${timestamp}.${rawBody}`
  const hmac = createHmac('sha256', secret).update(signed).digest('hex')
  return `t=${timestamp},v1=${hmac}`
}

// ---------------------------------------------------------------------------
// Factories de eventos Stripe
// ---------------------------------------------------------------------------
export function createCheckoutCompletedEvent(userId: string, sessionId = 'cs_test_e2e_001'): string {
  return JSON.stringify({
    id: `evt_e2e_${Date.now()}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        metadata: { userId },
      },
    },
  })
}

export function createUnknownEvent(): string {
  return JSON.stringify({
    id: 'evt_unknown_type',
    type: 'payment_intent.created', // tipo não tratado pela rota
    data: { object: {} },
  })
}
