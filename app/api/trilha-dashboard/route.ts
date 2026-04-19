import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { applyLocale, type Locale, DEFAULT_LOCALE } from '@/lib/locale'

/**
 * Uma única ida ao servidor para a página da trilha (substitui 4 fetches paralelos).
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const lang = (searchParams.get('lang') ?? DEFAULT_LOCALE) as Locale

  if (!slug) {
    return NextResponse.json({ error: 'Parâmetro slug obrigatório' }, { status: 400 })
  }

  const userId = (session.user as any).id
  const isPro = (session.user as any).isPro ?? false

  const trilha = await prisma.trilha.findFirst({
    where: { slug, publicada: true },
    include: {
      etapas: {
        select: { id: true, ordem: true, tipo: true, titulo: true, xpReward: true, temAnuncio: true },
      },
    },
  })

  if (!trilha) {
    return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })
  }

  const [progressos, desbloqueadas, certRow] = await Promise.all([
    prisma.progresso.findMany({
      where: { userId },
      select: { etapaId: true, trilhaId: true, xpGanho: true, concluidaEm: true },
    }),
    prisma.trilhaDesbloqueada.findMany({
      where: { userId },
      select: { trilhaId: true },
    }),
    prisma.certificado.findUnique({
      where: { userId_trilhaId: { userId, trilhaId: trilha.id } },
      select: { hash: true },
    }),
  ])

  const desbloqueadasIds = new Set(desbloqueadas.map(d => d.trilhaId))
  const progressosTrilha = progressos.filter(p => p.trilhaId === trilha.id)
  const totalEtapas = trilha.etapas.length
  const etapasConcluidas = progressosTrilha.length
  const pct = totalEtapas > 0 ? Math.min(100, Math.round((etapasConcluidas / totalEtapas) * 100)) : 0

  const base = { titulo: trilha.titulo, descricao: trilha.descricao }
  const localized = applyLocale(base, trilha.traducoes as Record<string, Partial<typeof base>> | null, lang)

  const trilhaPayload = {
    ...trilha,
    ...localized,
    progressos: progressosTrilha,
    etapasConcluidas,
    percentualConcluido: pct,
    desbloqueadaPorAnuncio: desbloqueadasIds.has(trilha.id),
  }

  return NextResponse.json({
    trilha: trilhaPayload,
    progressos,
    isPro,
    cert: certRow ? { hash: certRow.hash } : null,
  }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } })
}
