import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { applyLocale, type Locale, DEFAULT_LOCALE } from '@/lib/locale'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lang = (searchParams.get('lang') ?? DEFAULT_LOCALE) as Locale
  const session = await getServerSession(authOptions)

  const trilhas = await prisma.trilha.findMany({
    where: { publicada: true },
    orderBy: { ordem: 'asc' },
    include: {
      etapas: { select: { id: true, ordem: true, tipo: true, titulo: true, xpReward: true, temAnuncio: true } },
    },
  })

  if (!session?.user) {
    return NextResponse.json(trilhas.map(t => {
      const base = { titulo: t.titulo, descricao: t.descricao }
      const localized = applyLocale(base, t.traducoes as Record<string, Partial<typeof base>> | null, lang)
      return { ...t, ...localized, progressos: [] }
    }))
  }

  const userId = (session.user as any).id
  const [progressos, desbloqueadas] = await Promise.all([
    prisma.progresso.findMany({
      where: { userId },
      select: { etapaId: true, trilhaId: true, xpGanho: true, concluidaEm: true },
    }),
    prisma.trilhaDesbloqueada.findMany({
      where: { userId },
      select: { trilhaId: true },
    }),
  ])

  const desbloqueadasIds = new Set(desbloqueadas.map(d => d.trilhaId))

  const result = trilhas.map(trilha => {
    const progressosTrilha = progressos.filter(p => p.trilhaId === trilha.id)
    // Percentual calculado sobre todas as etapas (teoria + exercícios)
    const totalEtapas = trilha.etapas.length
    const etapasConcluidas = progressosTrilha.length
    const pct = totalEtapas > 0 ? Math.min(100, Math.round((etapasConcluidas / totalEtapas) * 100)) : 0
    const base = { titulo: trilha.titulo, descricao: trilha.descricao }
    const localized = applyLocale(base, trilha.traducoes as Record<string, Partial<typeof base>> | null, lang)
    return {
      ...trilha,
      ...localized,
      progressos: progressosTrilha,
      etapasConcluidas,
      percentualConcluido: pct,
      desbloqueadaPorAnuncio: desbloqueadasIds.has(trilha.id),
    }
  })

  // Encontrar a última trilha em andamento (com progresso mas não concluída)
  const ultimaAtividade = progressos.reduce((acc, p) => {
    if (!acc || new Date(p.concluidaEm) > new Date(acc.concluidaEm)) return p
    return acc
  }, null as typeof progressos[0] | null)

  // Só marca como "última" se a trilha não estiver 100% concluída
  const ultimaTrilhaId = ultimaAtividade
    ? (() => {
        const trilhaDoProgresso = result.find(t => t.id === ultimaAtividade.trilhaId)
        return trilhaDoProgresso && trilhaDoProgresso.percentualConcluido < 100
          ? ultimaAtividade.trilhaId
          : null
      })()
    : null

  return NextResponse.json(result.map(t => ({ ...t, ultimaTrilha: t.id === ultimaTrilhaId })))
}
