import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  // Rejeita imediatamente se não vier assinatura — requisições sem header da Stripe
  // não são legítimas e não devem executar nenhuma lógica de negócio.
  if (!sig) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const sess = event.data.object as Stripe.Checkout.Session
    const userId = sess.metadata?.userId
    if (!userId) return NextResponse.json({ ok: true })

    // Confirma que o userId do metadata corresponde a um usuário real antes de
    // conceder Pro — evita que metadados adulterados afetem contas arbitrárias.
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.error('[webhook] userId do metadata não encontrado:', userId)
      return NextResponse.json({ ok: true })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isPro: true, proAt: new Date() },
    })
    await prisma.pagamento.create({
      data: {
        userId,
        stripeSessionId: sess.id,
        valor: 3990,
        status: 'paid',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
