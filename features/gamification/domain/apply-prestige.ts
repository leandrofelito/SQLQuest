import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getLevel } from '@/features/gamification/domain/xp'
import { PRESTIGIO_NIVEL_MINIMO, PRESTIGIO_CONQUISTAS_CAP } from '@/features/gamification/domain/prestige'
import { buildPrestigeConquistaNotificacao } from '@/features/gamification/domain/conquistas-definitions'

export interface ConquistaNotificacaoPrestigio {
  id: string
  emoji: string
  nome: string
}

export interface AplicarPrestigioResult {
  applied: boolean
  novoPrestige?: number
  totalXp?: number
  novasConquistas?: ConquistaNotificacaoPrestigio[]
}

/**
 * Dentro de uma transação: se nível >= PRESTIGIO_NIVEL_MINIMO, zera XP do ciclo e incrementa prestige.
 */
export async function aplicarPrestigioSeElegivelTx(
  tx: Prisma.TransactionClient,
  userId: string,
  locale: string = 'pt'
): Promise<AplicarPrestigioResult> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { totalXp: true, prestige: true },
  })
  if (!user) return { applied: false }

  if (getLevel(user.totalXp) < PRESTIGIO_NIVEL_MINIMO || user.prestige >= PRESTIGIO_CONQUISTAS_CAP) {
    return { applied: false, totalXp: user.totalXp, novoPrestige: user.prestige }
  }

  const updated = await tx.user.update({
    where: { id: userId },
    data: { totalXp: 0, prestige: { increment: 1 } },
    select: { totalXp: true, prestige: true },
  })

  return {
    applied: true,
    novoPrestige: updated.prestige,
    totalXp: updated.totalXp,
    novasConquistas: [buildPrestigeConquistaNotificacao(updated.prestige, locale)],
  }
}

/** Transação própria; use `aplicarPrestigioSeElegivelTx` quando já estiver em `$transaction`. */
export async function aplicarPrestigioSeElegivel(
  userId: string,
  locale: string = 'pt'
): Promise<AplicarPrestigioResult> {
  return prisma.$transaction(tx => aplicarPrestigioSeElegivelTx(tx, userId, locale))
}
