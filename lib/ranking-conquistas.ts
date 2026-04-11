import { prisma } from './db'

export const RANKING_CONQUISTAS = [
  {
    tipo: 'top1',
    limite: 1,
    nome: 'Lenda do SQL',
    emoji: '👑',
    desc: 'Chegue ao Top 1 do ranking global de XP',
    cor: { borda: '#FFD700', brilho: 'rgba(255,215,0,0.25)', texto: '#FFD700', bg: 'rgba(255,215,0,0.08)' },
  },
  {
    tipo: 'top10',
    limite: 10,
    nome: 'Elite Global',
    emoji: '🥇',
    desc: 'Entre no Top 10 do ranking global de XP',
    cor: { borda: '#C0C0C0', brilho: 'rgba(192,192,192,0.2)', texto: '#C0C0C0', bg: 'rgba(192,192,192,0.07)' },
  },
  {
    tipo: 'top100',
    limite: 100,
    nome: 'Mestre dos Dados',
    emoji: '🥈',
    desc: 'Entre no Top 100 do ranking global de XP',
    cor: { borda: '#CD7F32', brilho: 'rgba(205,127,50,0.2)', texto: '#CD7F32', bg: 'rgba(205,127,50,0.07)' },
  },
  {
    tipo: 'top1000',
    limite: 1000,
    nome: 'Consistência',
    emoji: '🥉',
    desc: 'Entre no Top 1000 do ranking global de XP',
    cor: { borda: '#4A90E2', brilho: 'rgba(74,144,226,0.2)', texto: '#4A90E2', bg: 'rgba(74,144,226,0.07)' },
  },
] as const

const RANKING_I18N: Record<string, Record<string, { nome: string; desc: string }>> = {
  top1: {
    en: { nome: 'SQL Legend', desc: 'Reach Top 1 in the global XP ranking' },
    es: { nome: 'Leyenda SQL', desc: 'Llega al Top 1 del ranking global de XP' },
  },
  top10: {
    en: { nome: 'Global Elite', desc: 'Enter the Top 10 in the global XP ranking' },
    es: { nome: 'Élite Global', desc: 'Entra en el Top 10 del ranking global de XP' },
  },
  top100: {
    en: { nome: 'Data Master', desc: 'Enter the Top 100 in the global XP ranking' },
    es: { nome: 'Maestro de Datos', desc: 'Entra en el Top 100 del ranking global de XP' },
  },
  top1000: {
    en: { nome: 'Consistency', desc: 'Enter the Top 1000 in the global XP ranking' },
    es: { nome: 'Consistencia', desc: 'Entra en el Top 1000 del ranking global de XP' },
  },
}

export function getRankingConquistasLocalizadas(locale: string) {
  return RANKING_CONQUISTAS.map(rc => {
    const tr = RANKING_I18N[rc.tipo]?.[locale]
    return tr ? { ...rc, nome: tr.nome, desc: tr.desc } : rc
  })
}

export type RankingTipo = (typeof RANKING_CONQUISTAS)[number]['tipo']

/**
 * Usa RANK() para encontrar a posição atual do usuário no ranking global de XP.
 * Retorna null se o usuário ainda não tem XP.
 */
export async function getPosicaoRanking(userId: string): Promise<number | null> {
  const result = await prisma.$queryRaw<[{ posicao: bigint }]>`
    SELECT posicao FROM (
      SELECT id, RANK() OVER (ORDER BY "totalXp" DESC) AS posicao
      FROM "User"
      WHERE "totalXp" > 0
    ) ranked
    WHERE id = ${userId}
  `
  if (!result.length) return null
  return Number(result[0].posicao)
}

/**
 * Verifica se o usuário atingiu algum threshold de ranking e persiste
 * conquistas novas (permanentes). Retorna os nomes das conquistas recém-ganhas.
 */
export async function verificarConquistasRanking(userId: string): Promise<string[]> {
  const posicao = await getPosicaoRanking(userId)
  if (posicao === null) return []

  const jatem = await prisma.conquistaRanking.findMany({
    where: { userId },
    select: { tipo: true },
  })
  const tiposJaTem = new Set(jatem.map(c => c.tipo))

  const novasConquistas: string[] = []
  const novosDados: { userId: string; tipo: string; posicao: number }[] = []

  for (const conquista of RANKING_CONQUISTAS) {
    if (posicao <= conquista.limite && !tiposJaTem.has(conquista.tipo)) {
      novosDados.push({ userId, tipo: conquista.tipo, posicao })
      novasConquistas.push(conquista.nome)
    }
  }

  if (novosDados.length > 0) {
    await prisma.conquistaRanking.createMany({ data: novosDados, skipDuplicates: true })
  }

  return novasConquistas
}

/**
 * Retorna as conquistas de ranking já ganhas pelo usuário.
 */
export async function getConquistasRankingUsuario(userId: string) {
  return prisma.conquistaRanking.findMany({
    where: { userId },
    select: { tipo: true, posicao: true, alcancadaEm: true },
  })
}
