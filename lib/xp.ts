import type { Locale } from './locale'
import { getLevelRankTitle } from './levelTitles'

export const XP_POR_ESTRELAS: Record<number, number> = { 3: 100, 2: 60, 1: 30, 0: 0 }

export function calcularEstrelas(tentativas: number, dicasUsadas: number): number {
  if (dicasUsadas >= 1) return 1
  if (tentativas === 1) return 3
  return 2
}

export const XP_EVENTOS = {
  etapa_correta: 100,
  primeira_tentativa: 50,
  sem_dica: 30,
  streak_diario: 20,
  desafio: 15,
}

// Nível = f(XP total no ciclo atual). Ao prestigiar, XP zera e o nível volta a 1; prestígio +1 (estrela metálica).
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

/** Faixas de cor da barra / avatar (mais amplas que as patentes de nome). */
function getLevelVisualStyle(level: number): Pick<LevelBadge, 'cor' | 'brilho' | 'bg' | 'tier'> {
  if (level >= 100)
    return { cor: '#FFD700', brilho: 'rgba(255,215,0,0.35)', bg: 'rgba(255,215,0,0.1)', tier: 'lendario' }
  if (level >= 75)
    return { cor: '#FF4466', brilho: 'rgba(255,68,102,0.35)', bg: 'rgba(255,68,102,0.1)', tier: 'expert' }
  if (level >= 50)
    return { cor: '#FF8C00', brilho: 'rgba(255,140,0,0.35)', bg: 'rgba(255,140,0,0.1)', tier: 'mestre' }
  if (level >= 30)
    return { cor: '#A855F7', brilho: 'rgba(168,85,247,0.35)', bg: 'rgba(168,85,247,0.1)', tier: 'especialista' }
  if (level >= 20)
    return { cor: '#06B6D4', brilho: 'rgba(6,182,212,0.35)', bg: 'rgba(6,182,212,0.1)', tier: 'analista' }
  if (level >= 10)
    return { cor: '#4A90E2', brilho: 'rgba(74,144,226,0.35)', bg: 'rgba(74,144,226,0.1)', tier: 'explorador' }
  if (level >= 5)
    return { cor: '#4CAF50', brilho: 'rgba(76,175,80,0.35)', bg: 'rgba(76,175,80,0.1)', tier: 'iniciante' }
  return { cor: '#9E9E9E', brilho: 'rgba(158,158,158,0.2)', bg: 'rgba(158,158,158,0.06)', tier: 'aprendiz' }
}

/**
 * Patente + cores para o nível do ciclo atual (após prestígio volta a 1).
 * `locale` afeta só nome/emoji; cores seguem a faixa visual.
 */
export function getLevelBadge(level: number, locale: Locale = 'pt'): LevelBadge {
  const lv = Math.max(1, level)
  const title = getLevelRankTitle(lv, locale)
  const style = getLevelVisualStyle(lv)
  return { nome: title.nome, emoji: title.emoji, ...style }
}
