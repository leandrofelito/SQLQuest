/**
 * Regras de streak diário (alinhadas ao callback de sessão):
 * - Primeira atividade ou sem lastActiveAt: streak = 1
 * - Mesmo dia (diff 0): mantém streak
 * - Dia seguinte (diff 1): incrementa
 * - Gap > 1 dia: volta a 1
 */
export function computeNovoStreak(params: {
  streakAtual: number
  lastActiveAt: Date | null
  agora: Date
}): number {
  const { streakAtual, lastActiveAt, agora } = params
  if (!lastActiveAt) return 1

  const diffDias = Math.floor((agora.getTime() - lastActiveAt.getTime()) / 86400000)
  if (diffDias === 0) return streakAtual
  if (diffDias === 1) return streakAtual + 1
  if (diffDias > 1) return 1
  return streakAtual
}
