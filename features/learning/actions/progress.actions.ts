'use server'

import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkRateLimitDB } from '@/lib/rate-limit'
import { COOKIE_NAME } from '@/lib/locale'
import { verificarToken } from '@/features/auth/domain/validation-token'
import { calcularEstrelas, XP_POR_ESTRELAS, getLevel } from '@/features/gamification/domain/xp'
import { computeNovoStreak } from '@/features/gamification/domain/streak'
import { aplicarPrestigioSeElegivelTx } from '@/features/gamification/domain/apply-prestige'
import { verificarConquistasRanking } from '@/features/ranking/domain/ranking-conquistas'
import {
  TRILHA_CONQUISTA_SLUGS,
  TRILHA_CONQUISTAS,
  TRES_ESTRELAS_CONQUISTA,
  trilhaConquistaId,
  novasConquistasExercicios,
  novasConquistasNivel,
  novasConquistasStreak,
  type TrilhaConquistaSlug,
} from '@/features/gamification/domain/conquistas-definitions'
import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConquistaMeta {
  id: string
  emoji: string
  nome: string
}

/** Discriminated union: erros, já feito (sem XP), ou sucesso completo. */
export type SalvarProgressoResult =
  | { success: false; error: string }
  | { success: true; jaFeito: true; xpGanho: 0; estrelas: number }
  | {
      success: true
      jaFeito: false
      xpGanho: number
      estrelas: number
      certificadoCriado: boolean
      novasConquistasRanking: string[]
      nivelAnterior: number
      nivelAtual: number
      novasConquistas: ConquistaMeta[]
    }

// ─── Input schema ─────────────────────────────────────────────────────────────

const schema = z.object({
  trilhaId: z.string().min(1),
  etapaId: z.string().min(1),
  // Token HMAC gerado por /api/validar-query — sela tentativas e dicas no servidor
  token: z.string().min(1),
})

export type SalvarProgressoInput = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTrilhaConquistaSlug(s: string): s is TrilhaConquistaSlug {
  return (TRILHA_CONQUISTA_SLUGS as readonly string[]).includes(s)
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function salvarProgressoAction(
  input: SalvarProgressoInput,
): Promise<SalvarProgressoResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: 'Não autenticado' }

  const userId = (session.user as { id: string }).id

  // 100 submissões por usuário por hora — impede XP farming automatizado
  const rl = await checkRateLimitDB(`progresso:${userId}`, 100, 60 * 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: 'Muitas submissões. Tente novamente mais tarde.' }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Dados inválidos' }

  const { trilhaId, etapaId, token } = parsed.data

  // Verifica o token HMAC — rejeita qualquer payload adulterado ou expirado
  const payload = verificarToken(token)
  if (!payload || payload.userId !== userId || payload.etapaId !== etapaId) {
    return { success: false, error: 'Token de validação inválido ou expirado' }
  }

  // Usa os valores selados pelo servidor — o cliente não pode inflar tentativas ou omitir dicas
  const { tentativas, dicasUsadas } = payload

  const estrelas = calcularEstrelas(tentativas, dicasUsadas)
  const xpGanho = XP_POR_ESTRELAS[estrelas] ?? 30

  const existente = await prisma.progresso.findUnique({
    where: { userId_etapaId: { userId, etapaId } },
  })

  const tresEstrelasCountAntes = await prisma.progresso.count({
    where: { userId, estrelas: 3, xpGanho: { gt: 0 } },
  })

  let xpDelta = 0

  if (!existente) {
    await prisma.progresso.create({
      data: { userId, trilhaId, etapaId, xpGanho, tentativas, usouDica: dicasUsadas > 0, estrelas },
    })
    xpDelta = xpGanho
  } else if (estrelas > existente.estrelas) {
    // Novo recorde — concede apenas a diferença de XP
    xpDelta = xpGanho - existente.xpGanho
    await prisma.progresso.update({
      where: { userId_etapaId: { userId, etapaId } },
      data: { xpGanho, tentativas, usouDica: dicasUsadas > 0, estrelas, concluidaEm: new Date() },
    })
  } else {
    return { success: true, jaFeito: true, xpGanho: 0, estrelas: existente.estrelas }
  }

  let nivelAnterior = 1
  let nivelAtual = 1
  let userBefore: { totalXp: number; isPro: boolean; streak: number; lastActiveAt: Date | null } | null = null
  const novasConquistas: ConquistaMeta[] = []

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
    where: { id: trilhaId },
    select: { slug: true, etapas: { select: { id: true, tipo: true } } },
  })
  const progressosTrilha = await prisma.progresso.findMany({
    where: { userId, trilhaId },
  })

  const exercicioIds = new Set(trilha?.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id) ?? [])
  const progressosExercicios = progressosTrilha.filter(p => exercicioIds.has(p.etapaId)).length

  let certificadoCriado = false
  if (trilha && exercicioIds.size > 0 && progressosExercicios >= exercicioIds.size) {
    const isProUser =
      userBefore?.isPro ??
      (await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } }))?.isPro ??
      false
    if (isProUser) {
      const certExiste = await prisma.certificado.findUnique({
        where: { userId_trilhaId: { userId, trilhaId } },
      })
      if (!certExiste) {
        await prisma.certificado.create({ data: { userId, trilhaId } })
        certificadoCriado = true
      }
    }
  }

  if (!existente) {
    const novoTotalExercicios = await prisma.progresso.count({
      where: { userId, xpGanho: { gt: 0 }, etapa: { tipo: 'exercicio' } },
    })
    novasConquistas.push(...novasConquistasExercicios(novoTotalExercicios - 1, novoTotalExercicios))
  }

  if (!existente && trilha && isTrilhaConquistaSlug(trilha.slug)) {
    const exercicioIdsConquista = new Set(
      trilha.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id),
    )
    const concluidosComXp = progressosTrilha.filter(
      p => exercicioIdsConquista.has(p.etapaId) && p.xpGanho > 0,
    ).length
    if (exercicioIdsConquista.size > 0 && concluidosComXp >= exercicioIdsConquista.size) {
      const meta = TRILHA_CONQUISTAS[trilha.slug]
      novasConquistas.push({
        id: trilhaConquistaId(trilha.slug),
        emoji: meta.emoji,
        nome: meta.nome,
      })
    }
  }

  return {
    success: true,
    jaFeito: false,
    xpGanho: xpDelta,
    estrelas,
    certificadoCriado,
    novasConquistasRanking,
    nivelAnterior,
    nivelAtual,
    novasConquistas,
  }
}
