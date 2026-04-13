import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRankingConquistasLocalizadas, getConquistasRankingUsuario } from '@/lib/ranking-conquistas'
import { COOKIE_NAME } from '@/lib/locale'
import { getLevel } from '@/lib/xp'
import {
  CONQUISTAS_I18N,
  EXERCISE_MILESTONES,
  LEVEL_MILESTONES,
  STREAK_MILESTONES,
  TRILHA_CONQUISTA_SLUGS,
  TRES_ESTRELAS_CONQUISTA,
  listarDefinicoesConquistasGerais,
  localizarPrestigioConquista,
  parsePrestigioEstrelaN,
  temAlgumaTresEstrelas,
  trilhaConquistaId,
  trilhaExerciciosConcluida,
  totalExerciciosConcluidosGlobal,
  type ConquistaDef,
  type ProgressoConquistaInput,
} from '@/lib/conquistas-definitions'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const [progressos, dbUser, trilhas, conquistasRanking] = await Promise.all([
    prisma.progresso.findMany({
      where: { userId },
      include: {
        trilha: { select: { slug: true } },
        etapa: { select: { tipo: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, totalXp: true, prestige: true },
    }),
    prisma.trilha.findMany({
      select: { slug: true, etapas: { select: { tipo: true } } },
    }),
    getConquistasRankingUsuario(userId),
  ])

  const rankingDesbloqueados = new Set(conquistasRanking.map(c => c.tipo))
  const streak = dbUser?.streak ?? 0
  const nivelAtual = getLevel(dbUser?.totalXp ?? 0)
  const prestige = dbUser?.prestige ?? 0

  const exerciciosPorTrilha = Object.fromEntries(
    trilhas.map(t => [t.slug, t.etapas.filter(e => e.tipo === 'exercicio').length])
  )

  const progressosConquista = progressos as ProgressoConquistaInput[]
  const totalExGlobal = totalExerciciosConcluidosGlobal(progressosConquista)

  const defs = listarDefinicoesConquistasGerais()
  const conquistas = defs.map(def => {
    let desbloqueada = false
    if (def.categoria === 'habilidade' && def.id === TRES_ESTRELAS_CONQUISTA.id) {
      desbloqueada = temAlgumaTresEstrelas(progressosConquista)
    } else if (def.categoria === 'nivel') {
      const m = LEVEL_MILESTONES.find(n => n.id === def.id)
      desbloqueada = m ? nivelAtual >= m.nivel : false
    } else if (def.categoria === 'trilha') {
      for (const slug of TRILHA_CONQUISTA_SLUGS) {
        if (def.id === trilhaConquistaId(slug)) {
          desbloqueada = trilhaExerciciosConcluida(slug, progressosConquista, exerciciosPorTrilha)
          break
        }
      }
    } else if (def.categoria === 'streak') {
      const m = STREAK_MILESTONES.find(s => s.id === def.id)
      desbloqueada = m ? streak >= m.days : false
    } else if (def.categoria === 'exercicios') {
      const m = EXERCISE_MILESTONES.find(e => e.id === def.id)
      desbloqueada = m ? totalExGlobal >= m.count : false
    } else if (def.categoria === 'prestigio') {
      const pn = parsePrestigioEstrelaN(def.id)
      desbloqueada = pn != null && prestige >= pn
    }

    return {
      id: def.id,
      emoji: def.emoji,
      nome: def.nome,
      desc: def.desc,
      desbloqueada,
      categoria: def.categoria,
    }
  })

  const cookieStore = await cookies()
  const locale = cookieStore.get(COOKIE_NAME)?.value ?? 'pt'

  function localizar<T extends { id: string; nome: string; desc: string }>(c: T): T {
    if (c.id.startsWith('prestigio_estrela_')) {
      return localizarPrestigioConquista(c as unknown as ConquistaDef, locale) as unknown as T
    }
    const tr = CONQUISTAS_I18N[c.id]?.[locale]
    return tr ? { ...c, ...tr } : c
  }

  const rankingLocalizadas = getRankingConquistasLocalizadas(locale)
  const conquistasRankingFormatadas = rankingLocalizadas.map(rc => {
    const registro = conquistasRanking.find(c => c.tipo === rc.tipo)
    return {
      id: `ranking_${rc.tipo}`,
      emoji: rc.emoji,
      nome: rc.nome,
      desc: rc.desc,
      desbloqueada: rankingDesbloqueados.has(rc.tipo),
      alcancadaEm: registro?.alcancadaEm ?? null,
      posicao: registro?.posicao ?? null,
      tier: rc.tipo,
    }
  })

  return NextResponse.json([...conquistas.map(localizar), ...conquistasRankingFormatadas])
}
