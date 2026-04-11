import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const VALID_LOCALES = ['pt', 'en', 'es'] as const

// GET /api/user/language — retorna a preferência de idioma do usuário
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { language_preference: true },
  })

  if (!user) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({ language_preference: user.language_preference ?? 'pt' })
}

// PATCH /api/user/language — salva a preferência de idioma
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const lang = body?.language_preference

  if (!VALID_LOCALES.includes(lang)) {
    return NextResponse.json({ error: 'Idioma inválido' }, { status: 400 })
  }

  const userId = (session.user as any).id
  await prisma.user.update({
    where: { id: userId },
    data: { language_preference: lang },
  })

  return NextResponse.json({ ok: true })
}
