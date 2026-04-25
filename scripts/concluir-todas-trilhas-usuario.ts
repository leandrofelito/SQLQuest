/**
 * Marca todas as etapas de todas as trilhas publicadas como concluídas para um usuário.
 *
 * - Exercícios: 3 estrelas e XP conforme lib/xp (XP_POR_ESTRELAS[3]).
 * - Demais etapas (intro, texto, resumo, conclusão): progresso gravado com 0 XP (etapa "visitada").
 * - Incrementa totalXp / xpRanking só pela diferença em relação ao que já existia.
 * - Opcional: certificados por trilha (Pro ou --cert-forcar).
 * - Registra TrilhaDesbloqueada para cada trilha publicada (mapa / trilhas bloqueadas por anúncio).
 *
 * Uso:
 *   npx dotenv -e .env.local -- tsx scripts/concluir-todas-trilhas-usuario.ts seu@email.com
 *   npm run script:concluir-todas-trilhas -- seu@email.com
 *
 * Flags:
 *   --cert-forcar     Cria certificado em todas as trilhas com exercícios ok, mesmo sem Pro
 *   --sem-desbloqueio Não grava TrilhaDesbloqueada (só progresso)
 */
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'
import { XP_POR_ESTRELAS } from '../features/gamification/domain/xp'

const XP_3 = XP_POR_ESTRELAS[3] ?? 100

function resolveEmailArg(): string {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'))
  const raw = args[0]?.trim() ?? process.env.CONCLUIR_TODAS_TRILHAS_EMAIL?.trim()
  if (!raw) {
    console.error('Informe o e-mail: tsx scripts/concluir-todas-trilhas-usuario.ts <email>')
    process.exit(1)
  }
  return raw
}

async function findUserByEmail(email: string) {
  let user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  })
  if (!user && email.includes('gmial.com')) {
    user = await prisma.user.findUnique({
      where: { email: email.replace(/gmial\.com/gi, 'gmail.com') },
    })
  }
  return user
}

async function main() {
  const forcarCert = process.argv.includes('--cert-forcar')
  const semDesbloqueio = process.argv.includes('--sem-desbloqueio')
  const email = resolveEmailArg()

  const user = await findUserByEmail(email)
  if (!user) {
    console.error(`Usuário não encontrado: ${email}`)
    process.exit(1)
  }

  const trilhas = await prisma.trilha.findMany({
    where: { publicada: true },
    orderBy: { ordem: 'asc' },
    include: { etapas: { orderBy: { ordem: 'asc' } } },
  })

  if (trilhas.length === 0) {
    console.error('Nenhuma trilha publicada no banco.')
    process.exit(1)
  }

  const totalEtapas = trilhas.reduce((n, t) => n + t.etapas.length, 0)
  console.log(`Usuário: ${user.email} (${user.id})`)
  console.log(`Trilhas publicadas: ${trilhas.length} — ${totalEtapas} etapas no total\n`)

  let xpDelta = 0
  let criados = 0
  let atualizados = 0
  let inalterados = 0

  for (const trilha of trilhas) {
    console.log(`— ${trilha.titulo} (${trilha.slug}) — ${trilha.etapas.length} etapas`)

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
        criados++
        console.log(`    + ${etapa.ordem}. ${etapa.titulo} (${etapa.tipo})`)
      } else if (isEx && (existente.estrelas < 3 || existente.xpGanho < alvoXp)) {
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
        atualizados++
        console.log(`    ~ ${etapa.ordem}. ${etapa.titulo} (exercício)${diff > 0 ? ` +${diff} XP` : ''}`)
      } else {
        inalterados++
        console.log(`    = ${etapa.ordem}. ${etapa.titulo}`)
      }
    }
  }

  if (xpDelta > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { totalXp: { increment: xpDelta }, xpRanking: { increment: xpDelta } },
    })
    console.log(`\ntotalXp / xpRanking incrementados em +${xpDelta}`)
  } else {
    console.log('\nNenhum XP novo a incrementar.')
  }

  console.log(`Resumo progresso: ${criados} criados, ${atualizados} exercícios ajustados, ${inalterados} já ok.`)

  if (!semDesbloqueio) {
    for (const t of trilhas) {
      await prisma.trilhaDesbloqueada.upsert({
        where: { userId_trilhaId: { userId: user.id, trilhaId: t.id } },
        create: { userId: user.id, trilhaId: t.id },
        update: {},
      })
    }
    console.log(`TrilhaDesbloqueada: ${trilhas.length} trilhas (desbloqueio por anúncio / mapa).`)
  }

  const podeCert = user.isPro || forcarCert
  let certs = 0
  for (const trilha of trilhas) {
    const exercicioIds = trilha.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id)
    if (exercicioIds.length === 0) continue
    const feitos = await prisma.progresso.count({
      where: { userId: user.id, etapaId: { in: exercicioIds } },
    })
    if (feitos < exercicioIds.length) continue
    if (!podeCert) continue
    await prisma.certificado.upsert({
      where: { userId_trilhaId: { userId: user.id, trilhaId: trilha.id } },
      create: { userId: user.id, trilhaId: trilha.id },
      update: {},
    })
    certs++
  }

  if (podeCert) {
    console.log(`Certificados garantidos: ${certs} trilha(s).`)
  } else if (certs === 0) {
    console.log('Certificados: usuário não é Pro. Use --cert-forcar para criar certificados.')
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
