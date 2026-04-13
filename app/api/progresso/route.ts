import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { aplicarPrestigioSeElegivelTx } from '@/lib/aplicar-prestigio'
import { COOKIE_NAME } from '@/lib/locale'
import { calcularEstrelas, XP_POR_ESTRELAS, getLevel } from '@/lib/xp'
import { verificarConquistasRanking } from '@/lib/ranking-conquistas'
import { verificarToken } from '@/lib/validacao-token'
import { computeNovoStreak } from '@/lib/streak'
import {
  TRILHA_CONQUISTA_SLUGS,
  TRILHA_CONQUISTAS,
  TRES_ESTRELAS_CONQUISTA,
  trilhaConquistaId,
  novasConquistasExercicios,
  novasConquistasNivel,
  novasConquistasStreak,
  type TrilhaConquistaSlug,
} from '@/lib/conquistas-definitions'
import { z } from 'zod'

const schema = z.object({
  trilhaId: z.string(),
  etapaId: z.string(),
  token: z.string(), // HMAC-signed token issued by /api/validar-query
})

function isTrilhaConquistaSlug(s: string): s is TrilhaConquistaSlug {
  return (TRILHA_CONQUISTA_SLUGS as readonly string[]).includes(s)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  const body = parsed.data

  // Verify the HMAC token — rejects any tampered or expired payload
  const payload = verificarToken(body.token)
  if (!payload || payload.userId !== userId || payload.etapaId !== body.etapaId) {
    return NextResponse.json({ error: 'Token de validação inválido ou expirado' }, { status: 403 })
  }

  // Use server-sealed values — the client cannot inflate tentativas or hide dicasUsadas
  const { tentativas, dicasUsadas } = payload

  const estrelas = calcularEstrelas(tentativas, dicasUsadas)
  const xpGanho = XP_POR_ESTRELAS[estrelas] ?? 30

  const existente = await prisma.progresso.findUnique({
    where: { userId_etapaId: { userId, etapaId: body.etapaId } },
  })

  const tresEstrelasCountAntes = await prisma.progresso.count({
    where: { userId, estrelas: 3, xpGanho: { gt: 0 } },
  })

  let xpDelta = 0

  if (!existente) {
    // Primeira vez completando
    await prisma.progresso.create({
      data: {
        userId,
        trilhaId: body.trilhaId,
        etapaId: body.etapaId,
        xpGanho,
        tentativas,
        usouDica: dicasUsadas > 0,
        estrelas,
      },
    })
    xpDelta = xpGanho
  } else if (estrelas > existente.estrelas) {
    // Novo recorde — atualiza e concede apenas a diferença de XP
    xpDelta = xpGanho - existente.xpGanho
    await prisma.progresso.update({
      where: { userId_etapaId: { userId, etapaId: body.etapaId } },
      data: {
        xpGanho,
        tentativas,
        usouDica: dicasUsadas > 0,
        estrelas,
        concluidaEm: new Date(),
      },
    })
  } else {
    // Já feito com nota igual ou melhor
    return NextResponse.json({ xpGanho: 0, estrelas: existente.estrelas, jaFeito: true })
  }

  let nivelAnterior = 1
  let nivelAtual = 1
  let userBefore: { totalXp: number; isPro: boolean; streak: number; lastActiveAt: Date | null } | null = null
  const novasConquistas: Array<{ id: string; emoji: string; nome: string }> = []

  if (xpDelta > 0) {
    userBefore = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, isPro: true, streak: true, lastActiveAt: true },
    })
    nivelAnterior = getLevel(userBefore?.totalXp ?? 0)

    const agora = new Date()
    const streakAnterior = userBefore?.streak ?? 0
    const streakNovo = computeNovoStreak({
      streakAtual: streakAnterior,
      lastActiveAt: userBefore?.lastActiveAt ?? null,
      agora,
    })

    const xpAposIncremento = (userBefore?.totalXp ?? 0) + xpDelta
    const nivelAposIncremento = getLevel(xpAposIncremento)

    const cookieStore = await cookies()
    const localePrestigio = cookieStore.get(COOKIE_NAME)?.value ?? 'pt'

    const prestigioResult = await prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: xpDelta },
          xpRanking: { increment: xpDelta },
          streak: streakNovo,
          lastActiveAt: agora,
        },
      })
      return aplicarPrestigioSeElegivelTx(tx, userId, localePrestigio)
    })

    nivelAtual = prestigioResult.applied
      ? getLevel(prestigioResult.totalXp ?? 0)
      : nivelAposIncremento

    novasConquistas.push(...novasConquistasStreak(streakAnterior, streakNovo))
    novasConquistas.push(...novasConquistasNivel(nivelAnterior, nivelAposIncremento))
    if (prestigioResult.applied && prestigioResult.novasConquistas?.length) {
      novasConquistas.push(...prestigioResult.novasConquistas)
    }

    if (estrelas === 3 && tresEstrelasCountAntes === 0) {
      novasConquistas.push({
        id: TRES_ESTRELAS_CONQUISTA.id,
        emoji: TRES_ESTRELAS_CONQUISTA.emoji,
        nome: TRES_ESTRELAS_CONQUISTA.nome,
      })
    }
  }

  const novasConquistasRanking = await verificarConquistasRanking(userId)

  const trilha = await prisma.trilha.findUnique({
    where: { id: body.trilhaId },
    select: { slug: true, etapas: { select: { id: true, tipo: true } } },
  })
  const progressosTrilha = await prisma.progresso.findMany({
    where: { userId, trilhaId: body.trilhaId },
  })

  const exercicioIds = new Set(trilha?.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id) ?? [])
  const totalExercicios = exercicioIds.size
  const progressosExercicios = progressosTrilha.filter(p => exercicioIds.has(p.etapaId)).length

  let certificadoCriado = false
  if (trilha && totalExercicios > 0 && progressosExercicios >= totalExercicios) {
    const isProUser =
      userBefore?.isPro ??
      (await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } }))?.isPro ??
      false
    if (isProUser) {
      const certExiste = await prisma.certificado.findUnique({
        where: { userId_trilhaId: { userId, trilhaId: body.trilhaId } },
      })
      if (!certExiste) {
        await prisma.certificado.create({ data: { userId, trilhaId: body.trilhaId } })
        certificadoCriado = true
      }
    }
  }

  if (!existente) {
    const novoTotalExercicios = await prisma.progresso.count({
      where: { userId, xpGanho: { gt: 0 }, etapa: { tipo: 'exercicio' } },
    })
    const anteriorTotal = novoTotalExercicios - 1
    novasConquistas.push(...novasConquistasExercicios(anteriorTotal, novoTotalExercicios))
  }

  if (!existente && trilha && isTrilhaConquistaSlug(trilha.slug)) {
    const exercicioIdsConquista = new Set(trilha.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id))
    const totalExerciciosConquista = exercicioIdsConquista.size
    const concluidosComXp = progressosTrilha.filter(
      p => exercicioIdsConquista.has(p.etapaId) && p.xpGanho > 0
    ).length
    if (totalExerciciosConquista > 0 && concluidosComXp >= totalExerciciosConquista) {
      const meta = TRILHA_CONQUISTAS[trilha.slug]
      novasConquistas.push({
        id: trilhaConquistaId(trilha.slug),
        emoji: meta.emoji,
        nome: meta.nome,
      })
    }
  }

  return NextResponse.json({
    xpGanho: xpDelta,
    estrelas,
    certificadoCriado,
    novasConquistasRanking,
    nivelAnterior,
    nivelAtual,
    novasConquistas,
  })
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const trilhaId = searchParams.get('trilhaId')

  const where = trilhaId ? { userId, trilhaId } : { userId }
  const progressos = await prisma.progresso.findMany({ where })
  return NextResponse.json(progressos)
}
