import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLevel } from '@/lib/xp'
import { PRESTIGIO_NIVEL_MINIMO } from '@/lib/prestigio'
import { aplicarPrestigioSeElegivel } from '@/lib/aplicar-prestigio'
import { COOKIE_NAME } from '@/lib/locale'

// POST /api/prestige — mesmo efeito do prestígio automático (compatível com chamadas legadas)
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const cookieStore = await cookies()
  const loc = cookieStore.get(COOKIE_NAME)?.value ?? 'pt'

  const result = await aplicarPrestigioSeElegivel(userId, loc)

  if (result.applied) {
    return NextResponse.json({
      prestige: result.novoPrestige,
      mensagem: `Prestígio ${result.novoPrestige} alcançado! Voltando ao Nível 1.`,
      novasConquistas: result.novasConquistas,
    })
  }

  const exists = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXp: true },
  })
  if (!exists) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const nivelAtual = getLevel(exists.totalXp)
  return NextResponse.json(
    {
      error: `Você precisa estar no Nível ${PRESTIGIO_NIVEL_MINIMO} para fazer o Prestígio. Nível atual: ${nivelAtual}`,
    },
    { status: 400 }
  )
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
    elegivel: nivelAtual >= PRESTIGIO_NIVEL_MINIMO,
  })
}
