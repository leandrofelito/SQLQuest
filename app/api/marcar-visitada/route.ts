import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  trilhaId: z.string(),
  etapaId: z.string(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { trilhaId, etapaId } = parsed.data

  // Garante que a etapa existe e não é exercício (exercícios usam /api/progresso com token HMAC)
  const etapa = await prisma.etapa.findUnique({
    where: { id: etapaId },
    select: { tipo: true, trilhaId: true },
  })
  if (!etapa) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })
  if (etapa.tipo === 'exercicio') {
    return NextResponse.json({ error: 'Exercícios devem usar /api/progresso' }, { status: 400 })
  }
  if (etapa.trilhaId !== trilhaId) {
    return NextResponse.json({ error: 'Trilha inválida para esta etapa' }, { status: 400 })
  }

  // Upsert: marca como visitada sem conceder XP
  await prisma.progresso.upsert({
    where: { userId_etapaId: { userId, etapaId } },
    create: {
      userId,
      trilhaId,
      etapaId,
      xpGanho: 0,
      tentativas: 1,
      usouDica: false,
      estrelas: 0,
    },
    update: {}, // já visitada, sem alteração
  })

  return NextResponse.json({ ok: true })
}
