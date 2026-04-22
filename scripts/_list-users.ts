import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/db'

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, nickname: true, isPro: true, totalXp: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  console.log(`\nTotal de usuários: ${users.length}\n`)
  users.forEach(u => {
    const flag = (u.email?.includes('usuarioteste') || u.nickname?.includes('usuarioteste') || u.email === 'usuariopremium@teste.com.br')
      ? '  ← MANTER'
      : '  ← DELETAR'
    console.log(`${(u.email || '(sem email)').padEnd(45)} nick: ${(u.nickname || '-').padEnd(20)} pro: ${u.isPro}  xp: ${u.totalXp}${flag}`)
  })
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
