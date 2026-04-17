import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { checkRateLimitDB } from '@/lib/rate-limit'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id as string
  const userEmail = session.user.email!

  // 3 sessões de checkout por usuário por dia — evita abuso da API do Stripe
  const rl = await checkRateLimitDB(`checkout:${userId}`, 3, 24 * 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente mais tarde.' },
      { status: 429 }
    )
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'boleto'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'SQLQuest Pro — Vitalício',
            description: 'Acesso vitalício: sem anúncios + certificados por trilha',
            images: [`${process.env.NEXT_PUBLIC_URL}/og.png`],
          },
          unit_amount: 3990,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/home?pro=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/upgrade`,
    customer_email: userEmail,
    metadata: { userId },
    payment_intent_data: { metadata: { userId } },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
