export const XP_POR_ESTRELAS: Record<number, number> = { 3: 100, 2: 60, 1: 30, 0: 0 }

export function calcularEstrelas(tentativas: number, dicasUsadas: number): number {
  if (tentativas >= 3 || dicasUsadas >= 2) return 1
  if (tentativas === 1 && dicasUsadas === 0) return 3
  return 2
}

export const XP_EVENTOS = {
  etapa_correta: 100,
  primeira_tentativa: 50,
  sem_dica: 30,
  streak_diario: 20,
  desafio: 15,
}

// XP total necessário para atingir o nível n (1-indexado)
// Fórmula: 150 * (n-1) * n
// Nível  1 →       0 XP
// Nível  2 →     300 XP
// Nível  3 →     900 XP
// Nível  4 →   1.800 XP
// Nível  5 →   3.000 XP
// Nível 10 →  13.500 XP
// Nível 20 →  57.000 XP
// Nível 50 → 367.500 XP
export function xpParaNivel(n: number): number {
  if (n <= 1) return 0
  return 150 * (n - 1) * n
}

// Retorna o nível atual (1-indexado) com base no XP total
export function getLevel(xp: number): number {
  if (xp <= 0) return 1
  // Inversa de 150*(n-1)*n: n = (1 + sqrt(1 + 4*xp/150)) / 2
  const n = Math.floor((1 + Math.sqrt(1 + (4 * xp) / 150)) / 2)
  return Math.max(1, n)
}

export function getLevelLabel(xp: number): string {
  return `Nível ${getLevel(xp)}`
}

export function getProgressoPct(xp: number): number {
  const lv = getLevel(xp)
  const base = xpParaNivel(lv)
  const prox = xpParaNivel(lv + 1)
  if (prox === base) return 100
  return Math.round(((xp - base) / (prox - base)) * 100)
}

export function getXpParaProximo(xp: number): number {
  const lv = getLevel(xp)
  return xpParaNivel(lv + 1)
}

// Marcos de nível para conquistas
export const LEVEL_MILESTONES = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 400, 500, 750, 1000]

export interface LevelBadge {
  nome: string
  cor: string
  brilho: string
  bg: string
  emoji: string
  tier: 'aprendiz' | 'iniciante' | 'explorador' | 'analista' | 'especialista' | 'mestre' | 'expert' | 'lendario'
}

export function getLevelBadge(level: number): LevelBadge {
  if (level >= 100) return { nome: 'Lendário',    cor: '#FFD700', brilho: 'rgba(255,215,0,0.35)',   bg: 'rgba(255,215,0,0.1)',   emoji: '👑', tier: 'lendario' }
  if (level >= 75)  return { nome: 'Expert',       cor: '#FF4466', brilho: 'rgba(255,68,102,0.35)',  bg: 'rgba(255,68,102,0.1)',  emoji: '🔥', tier: 'expert' }
  if (level >= 50)  return { nome: 'Mestre',       cor: '#FF8C00', brilho: 'rgba(255,140,0,0.35)',   bg: 'rgba(255,140,0,0.1)',   emoji: '⚔️', tier: 'mestre' }
  if (level >= 30)  return { nome: 'Especialista', cor: '#A855F7', brilho: 'rgba(168,85,247,0.35)',  bg: 'rgba(168,85,247,0.1)',  emoji: '💎', tier: 'especialista' }
  if (level >= 20)  return { nome: 'Analista',     cor: '#06B6D4', brilho: 'rgba(6,182,212,0.35)',   bg: 'rgba(6,182,212,0.1)',   emoji: '📊', tier: 'analista' }
  if (level >= 10)  return { nome: 'Explorador',   cor: '#4A90E2', brilho: 'rgba(74,144,226,0.35)',  bg: 'rgba(74,144,226,0.1)',  emoji: '🗺️', tier: 'explorador' }
  if (level >= 5)   return { nome: 'Iniciante',    cor: '#4CAF50', brilho: 'rgba(76,175,80,0.35)',   bg: 'rgba(76,175,80,0.1)',   emoji: '🌱', tier: 'iniciante' }
  return               { nome: 'Aprendiz',     cor: '#9E9E9E', brilho: 'rgba(158,158,158,0.2)',  bg: 'rgba(158,158,158,0.06)', emoji: '📚', tier: 'aprendiz' }
}
