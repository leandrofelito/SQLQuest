import { calcularEstrelas, getLevel, XP_EVENTOS, XP_POR_ESTRELAS } from './xp'

export interface ProgressResult {
  estrelas: number
  xpGanho: number
  xpTotal: number
  novoNivel: number
}

export function calculateProgress(
  tentativas: number,
  usouDica: boolean,
  xpAtual: number,
): ProgressResult {
  const estrelas = calcularEstrelas(tentativas, usouDica ? 1 : 0)

  let xpGanho = XP_POR_ESTRELAS[estrelas] ?? 0
  if (tentativas === 1) xpGanho += XP_EVENTOS.primeira_tentativa
  if (!usouDica) xpGanho += XP_EVENTOS.sem_dica

  const xpTotal = Math.max(0, xpAtual) + xpGanho
  const novoNivel = getLevel(xpTotal)

  return { estrelas, xpGanho, xpTotal, novoNivel }
}
