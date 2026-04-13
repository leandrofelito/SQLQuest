/**
 * Marca todas as etapas da trilha com ordem=1 (ex.: Fundamentos) como concluídas para um usuário.
 *
 * Uso:
 *   npx dotenv -e .env.local -- tsx scripts/concluir-trilha-usuario.ts [email]
 *   npm run script:concluir-trilha -- seu@email.com
 *
 * Opções via argv:
 *   --cert-forcar  Cria certificado mesmo se o usuário não for Pro (útil em testes)
 *
 * Exercícios: 3 estrelas e XP conforme lib/xp (100). Demais etapas: como "visitada" (0 XP).
 */
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'
import { XP_POR_ESTRELAS } from '../lib/xp'

const XP_3 = XP_POR_ESTRELAS[3] ?? 100

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
  const forcarCert = process.argv.includes('--cert-forcar')

  let email = args[0] ?? process.env.TRILHA_CONCLUIR_EMAIL ?? 'leandrofelito4@gmial.com'

  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (email.includes('gmial.com')
      ? await prisma.user.findUnique({ where: { email: email.replace('gmial.com', 'gmail.com') } })
      : null)

  if (!user) {
    console.error(`Usuário não encontrado para o e-mail: ${email}`)
    process.exit(1)
  }

  const trilha = await prisma.trilha.findFirst({
    where: { publicada: true, ordem: 1 },
    include: { etapas: { orderBy: { ordem: 'asc' } } },
  })

  if (!trilha) {
    console.error('Nenhuma trilha publicada com ordem=1.')
    process.exit(1)
  }

  console.log(`Usuário: ${user.email} (${user.id})`)
  console.log(`Trilha: ${trilha.titulo} (${trilha.slug}) — ${trilha.etapas.length} etapas`)

  let xpDelta = 0

  for (const etapa of trilha.etapas) {
    const isEx = etapa.tipo === 'exercicio'
    const alvoXp = isEx ? XP_3 : 0
    const alvoEstrelas = isEx ? 3 : 0

    const existente = await prisma.progresso.findUnique({
      where: { userId_etapaId: { userId: user.id, etapaId: etapa.id } },
    })

    if (!existente) {
      await prisma.progresso.create({
        data: {
          userId: user.id,
          trilhaId: trilha.id,
          etapaId: etapa.id,
          xpGanho: alvoXp,
          tentativas: 1,
          usouDica: false,
          estrelas: alvoEstrelas,
        },
      })
      xpDelta += alvoXp
      console.log(`  + ${etapa.ordem}. ${etapa.titulo} (${etapa.tipo}) — criado`)
    } else {
      if (isEx && (existente.estrelas < 3 || existente.xpGanho < alvoXp)) {
        const diff = alvoXp - existente.xpGanho
        await prisma.progresso.update({
          where: { userId_etapaId: { userId: user.id, etapaId: etapa.id } },
          data: {
            xpGanho: alvoXp,
            tentativas: 1,
            usouDica: false,
            estrelas: 3,
            concluidaEm: new Date(),
          },
        })
        if (diff > 0) xpDelta += diff
        console.log(`  ~ ${etapa.ordem}. ${etapa.titulo} — exercício atualizado (+${diff} XP)`)
      } else {
        console.log(`  = ${etapa.ordem}. ${etapa.titulo} — já ok`)
      }
    }
  }

  if (xpDelta > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { totalXp: { increment: xpDelta }, xpRanking: { increment: xpDelta } },
    })
    console.log(`\nXP do usuário incrementado em +${xpDelta}`)
  } else {
    console.log('\nNenhum XP novo (já estava completo ou só etapas teóricas).')
  }

  const exercicioIds = trilha.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id)
  const progressos = await prisma.progresso.findMany({
    where: { userId: user.id, trilhaId: trilha.id },
    select: { etapaId: true },
  })
  const feitos = progressos.filter(p => exercicioIds.includes(p.etapaId)).length

  if (exercicioIds.length > 0 && feitos >= exercicioIds.length) {
    const podeCert = user.isPro || forcarCert
    if (podeCert) {
      await prisma.certificado.upsert({
        where: { userId_trilhaId: { userId: user.id, trilhaId: trilha.id } },
        create: { userId: user.id, trilhaId: trilha.id },
        update: {},
      })
      console.log(forcarCert && !user.isPro ? 'Certificado criado (--cert-forcar).' : 'Certificado garantido (Pro).')
    } else {
      console.log('Certificado não criado: usuário não é Pro. Use --cert-forcar para forçar.')
    }
  }

  console.log('\nConcluído.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
