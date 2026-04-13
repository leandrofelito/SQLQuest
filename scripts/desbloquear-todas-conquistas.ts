/**
 * Coloca o usuário no máximo de XP do ciclo **sem** atingir o nível de prestígio automático na sessão,
 * completa todos os exercícios do banco (3★ + XP) e grava conquistas de ranking.
 *
 * Importante: `lib/auth.ts` chama `aplicarPrestigioSeElegivel` em todo carregamento de sessão se
 * `getLevel(totalXp) >= PRESTIGIO_NIVEL_MINIMO` (100), zerando o XP. Por isso o alvo é o teto do
 * nível 99 (`xpParaNivel(100) - 1`), não o teto do nível 100 — senão o próximo login mostra nível 1.
 *
 * Uso:
 *   npx dotenv -e .env.local -- tsx scripts/desbloquear-todas-conquistas.ts [email]
 *
 * Observação: a conquista de 10.000 exercícios só desbloqueia se existirem ≥10.000
 * etapas tipo "exercicio" no banco (único por etapa por usuário).
 */
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'
import { XP_POR_ESTRELAS, xpParaNivel, getLevel } from '../lib/xp'
import { PRESTIGIO_CONQUISTAS_CAP, PRESTIGIO_NIVEL_MINIMO } from '../lib/prestigio'

const XP_3 = XP_POR_ESTRELAS[3] ?? 100
const STREAK_ALVO = 3650
const RANKING_TIPOS = ['top1', 'top10', 'top100', 'top1000'] as const

/** Maior XP ainda no nível PRESTIGIO_NIVEL_MINIMO - 1 (evita prestígio no callback de sessão). */
function xpMaxCicloSemPrestigioNaSessao(): number {
  return xpParaNivel(PRESTIGIO_NIVEL_MINIMO) - 1
}

async function main() {
  const emailArg = process.argv[2] ?? 'Teste@usuario.com.br'
  const email = emailArg.trim()

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })
  if (!user) {
    console.error(`Usuário não encontrado: ${email}`)
    process.exit(1)
  }

  const etapasEx = await prisma.etapa.findMany({
    where: { tipo: 'exercicio' },
    select: { id: true, trilhaId: true, ordem: true, titulo: true },
    orderBy: [{ trilhaId: 'asc' }, { ordem: 'asc' }],
  })

  console.log(`Usuário: ${user.email} (${user.id})`)
  console.log(`Etapas exercício no banco: ${etapasEx.length}`)

  let criados = 0
  let atualizados = 0

  for (const et of etapasEx) {
    const existente = await prisma.progresso.findUnique({
      where: { userId_etapaId: { userId: user.id, etapaId: et.id } },
    })
    const isNew = !existente
    await prisma.progresso.upsert({
      where: { userId_etapaId: { userId: user.id, etapaId: et.id } },
      create: {
        userId: user.id,
        trilhaId: et.trilhaId,
        etapaId: et.id,
        xpGanho: XP_3,
        tentativas: 1,
        usouDica: false,
        estrelas: 3,
      },
      update: {
        xpGanho: XP_3,
        tentativas: 1,
        usouDica: false,
        estrelas: 3,
        concluidaEm: new Date(),
      },
    })
    if (isNew) criados++
    else atualizados++
  }

  console.log(`Progresso exercícios: ${criados} criados, ${atualizados} atualizados (total ${etapasEx.length}).`)

  const countComXp = await prisma.progresso.count({
    where: { userId: user.id, xpGanho: { gt: 0 }, etapa: { tipo: 'exercicio' } },
  })
  console.log(`Exercícios com XP>0: ${countComXp} (marco 10000: ${countComXp >= 10000 ? 'ok' : 'indisponível com o banco atual'})`)

  for (const tipo of RANKING_TIPOS) {
    await prisma.conquistaRanking.upsert({
      where: { userId_tipo: { userId: user.id, tipo } },
      create: { userId: user.id, tipo, posicao: 1 },
      update: { posicao: 1 },
    })
  }
  console.log('Conquistas de ranking (top1/10/100/1000) gravadas.')

  const xpAlvo = xpMaxCicloSemPrestigioNaSessao()
  const sumAgg = await prisma.progresso.aggregate({
    where: { userId: user.id },
    _sum: { xpGanho: true },
  })
  const xpSumProgresso = sumAgg._sum.xpGanho ?? 0
  const uRank = await prisma.user.findUnique({
    where: { id: user.id },
    select: { xpRanking: true },
  })
  const xpRankingAlvo = Math.max(uRank?.xpRanking ?? 0, xpSumProgresso, xpAlvo)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalXp: xpAlvo,
      xpRanking: xpRankingAlvo,
      streak: STREAK_ALVO,
      prestige: PRESTIGIO_CONQUISTAS_CAP,
      lastActiveAt: new Date(),
    },
  })

  const nv = getLevel(xpAlvo)
  console.log(
    `User atualizado: totalXp=${xpAlvo}, xpRanking=${xpRankingAlvo}, nível=${nv}, streak=${STREAK_ALVO}, prestige=${PRESTIGIO_CONQUISTAS_CAP}`,
  )
  console.log('Concluído.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
