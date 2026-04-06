import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)

  const trilhas = await prisma.trilha.findMany({
    where: { publicada: true },
    orderBy: { ordem: 'asc' },
    include: {
      etapas: { select: { id: true, ordem: true, tipo: true, titulo: true, xpReward: true, temAnuncio: true } },
    },
  })

  if (!session?.user) {
    return NextResponse.json(trilhas.map(t => ({ ...t, progressos: [] })))
  }

  const userId = (session.user as any).id
  const progressos = await prisma.progresso.findMany({
    where: { userId },
    select: { etapaId: true, trilhaId: true, xpGanho: true },
  })

  const result = trilhas.map(trilha => {
    const progressosTrilha = progressos.filter(p => p.trilhaId === trilha.id)
    // Só exercícios salvam progresso — usar apenas eles como base do percentual
    const exercicioEtapas = trilha.etapas.filter(e => e.tipo === 'exercicio')
    const etapasConcluidas = progressosTrilha.length
    const totalExercicios = exercicioEtapas.length
    const pct = totalExercicios > 0 ? Math.min(100, Math.round((etapasConcluidas / totalExercicios) * 100)) : 0
    return {
      ...trilha,
      progressos: progressosTrilha,
      etapasConcluidas,
      percentualConcluido: pct,
    }
  })

  return NextResponse.json(result)
}
