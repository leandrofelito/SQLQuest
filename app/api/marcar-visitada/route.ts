import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  trilhaId: z.string(),
  etapaId: z.string(),
  // fallback: true quando /api/progresso falhou — permite marcar exercício com 0 XP
  fallback: z.boolean().optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { trilhaId, etapaId, fallback } = parsed.data

  // Garante que a etapa existe
  const etapa = await prisma.etapa.findUnique({
    where: { id: etapaId },
    select: { tipo: true, trilhaId: true },
  })
  if (!etapa) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })

  // Exercícios normalmente usam /api/progresso com token HMAC.
  // fallback=true: /api/progresso falhou (token inválido/rede) — permite marcar com 0 XP
  // para que o guard da próxima etapa passe. Não sobrescreve progresso existente com XP.
  if (etapa.tipo === 'exercicio' && !fallback) {
    return NextResponse.json({ error: 'Exercícios devem usar /api/progresso' }, { status: 400 })
  }

  if (etapa.trilhaId !== trilhaId) {
    return NextResponse.json({ error: 'Trilha inválida para esta etapa' }, { status: 400 })
  }

  if (etapa.tipo === 'exercicio' && fallback) {
    // Fallback de exercício: cria apenas se não existe progresso (preserva XP legítimo)
    const existente = await prisma.progresso.findUnique({
      where: { userId_etapaId: { userId, etapaId } },
    })
    if (!existente) {
      await prisma.progresso.create({
        data: { userId, trilhaId, etapaId, xpGanho: 0, tentativas: 1, usouDica: false, estrelas: 0 },
      })
    }
    return NextResponse.json({ ok: true, fallback: true })
  }

  // Upsert: marca etapa de leitura/intro/resumo/conclusao como visitada sem conceder XP
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
