import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { trilhaSlug } = await req.json()

  if (!trilhaSlug) {
    return NextResponse.json({ error: 'trilhaSlug obrigatório' }, { status: 400 })
  }

  const trilha = await prisma.trilha.findUnique({ where: { slug: trilhaSlug }, select: { id: true } })
  if (!trilha) {
    return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })
  }

  await prisma.trilhaDesbloqueada.upsert({
    where: { userId_trilhaId: { userId, trilhaId: trilha.id } },
    create: { userId, trilhaId: trilha.id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
