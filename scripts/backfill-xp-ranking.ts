/**
 * Sincroniza User.xpRanking com a soma de Progresso.xpGanho (e mantém o maior valor já gravado).
 * Rode uma vez após adicionar a coluna (ex.: `npm run db:push`):
 *   npx dotenv -e .env.local -- npx tsx scripts/backfill-xp-ranking.ts
 */
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "User" u
    SET "xpRanking" = GREATEST(
      COALESCE(u."xpRanking", 0),
      COALESCE((SELECT SUM(p."xpGanho")::int FROM "Progresso" p WHERE p."userId" = u.id), 0)
    )
  `
  console.log('Backfill xpRanking concluído (linhas afetadas):', result)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
