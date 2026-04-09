import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const userEmail = session.user.email!

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
          unit_amount: 1990,
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
