import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

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

    await prisma.user.update({
      where: { id: userId },
      data: { isPro: true, proAt: new Date() },
    })
    await prisma.pagamento.create({
      data: {
        userId,
        stripeSessionId: sess.id,
        valor: 5990,
        status: 'paid',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
