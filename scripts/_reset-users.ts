import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/db'

const MANTER  = ['usuariomaster@teste.com.br', 'leandrofelito1@gmail.com']
const RESETAR: string[] = []

async function main() {
  // ── 1. Deletar usuários que não estão em nenhuma lista ──────────────────
  const deletar = await prisma.user.findMany({
    where: { email: { notIn: [...MANTER, ...RESETAR] } },
    select: { id: true, email: true, nickname: true },
  })

  if (deletar.length) {
    console.log(`\n🗑️  Deletando ${deletar.length} usuário(s):`)
    deletar.forEach(u => console.log(`   ${u.email} (${u.nickname})`))
    await prisma.user.deleteMany({ where: { id: { in: deletar.map(u => u.id) } } })
    console.log('   ✅ Deletado(s)')
  } else {
    console.log('\n✅ Nenhum usuário para deletar.')
  }

  // ── 2. Resetar usuários da lista RESETAR ────────────────────────────────
  for (const email of RESETAR) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) { console.log(`\n⚠️  ${email} não encontrado.`); continue }

    console.log(`\n🔄 Resetando ${email} (${user.nickname})...`)

    // Apaga todos os dados de progresso
    const [prog, cert, conq, desbloq] = await Promise.all([
      prisma.progresso.deleteMany({ where: { userId: user.id } }),
      prisma.certificado.deleteMany({ where: { userId: user.id } }),
      prisma.conquistaRanking.deleteMany({ where: { userId: user.id } }),
      prisma.trilhaDesbloqueada.deleteMany({ where: { userId: user.id } }),
    ])
    console.log(`   progressos: ${prog.count}  certificados: ${cert.count}  conquistas: ${conq.count}  trilhas desbloqueadas: ${desbloq.count}`)

    // Zera os contadores do perfil
    await prisma.user.update({
      where: { id: user.id },
      data: { totalXp: 0, xpRanking: 0, streak: 0, prestige: 0, lastActiveAt: null },
    })
    console.log('   ✅ Perfil zerado')
  }

  // ── 3. Estado final ─────────────────────────────────────────────────────
  console.log('\n📋 Estado final:')
  const final = await prisma.user.findMany({
    select: { email: true, nickname: true, isPro: true, totalXp: true, streak: true },
    orderBy: { createdAt: 'asc' },
  })
  final.forEach(u =>
    console.log(`   ${(u.email||'').padEnd(40)} nick: ${(u.nickname||'-').padEnd(18)} pro: ${u.isPro}  xp: ${u.totalXp}  streak: ${u.streak}`)
  )

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
