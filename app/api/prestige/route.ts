import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLevel } from '@/lib/xp'

// POST /api/prestige — reseta XP para 0 e incrementa prestige (somente se level >= 100)
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXp: true, prestige: true },
  })

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const nivelAtual = getLevel(user.totalXp)
  if (nivelAtual < 100) {
    return NextResponse.json(
      { error: `Você precisa estar no Nível 100 para fazer o Prestígio. Nível atual: ${nivelAtual}` },
      { status: 400 }
    )
  }

  const novoPrestige = user.prestige + 1

  await prisma.user.update({
    where: { id: userId },
    data: { totalXp: 0, prestige: novoPrestige },
  })

  return NextResponse.json({ prestige: novoPrestige, mensagem: `Prestígio ${novoPrestige} alcançado! Voltando ao Nível 1.` })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXp: true, prestige: true },
  })

  const nivelAtual = getLevel(user?.totalXp ?? 0)

  return NextResponse.json({
    prestige: user?.prestige ?? 0,
    nivelAtual,
    elegivel: nivelAtual >= 100,
  })
}
