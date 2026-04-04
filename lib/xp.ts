export const LEVELS = [0, 300, 800, 1800, 3500, 6000, 10000, 20000, 99999]

export const XP_EVENTOS = {
  etapa_correta: 100,
  primeira_tentativa: 50,
  sem_dica: 30,
  streak_diario: 20,
  desafio: 15,
}

export function getLevel(xp: number): number {
  const idx = LEVELS.findIndex(v => xp < v)
  return idx === -1 ? LEVELS.length - 1 : idx - 1
}

export function getLevelLabel(xp: number): string {
  return `Nível ${getLevel(xp) + 1}`
}

export function getProgressoPct(xp: number): number {
  const lv = getLevel(xp)
  const base = LEVELS[lv]
  const prox = LEVELS[lv + 1] ?? LEVELS[lv]
  if (prox === base) return 100
  return Math.round(((xp - base) / (prox - base)) * 100)
}

export function getXpParaProximo(xp: number): number {
  const lv = getLevel(xp)
  return LEVELS[lv + 1] ?? xp
}
