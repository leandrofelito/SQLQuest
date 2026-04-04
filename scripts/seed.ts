import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'
import fs from 'fs'
import path from 'path'

async function seed() {
  const dir = path.join(process.cwd(), 'content/trilhas')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()

  console.log(`\n🌱 Iniciando seed com ${files.length} trilhas...\n`)

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))

    const trilha = await prisma.trilha.upsert({
      where: { slug: data.slug },
      update: {
        titulo: data.titulo,
        descricao: data.descricao,
        icone: data.icone,
        ordem: data.ordem,
        totalEtapas: data.etapas.length,
        xpTotal: data.xpTotal,
        publicada: true,
      },
      create: {
        slug: data.slug,
        titulo: data.titulo,
        descricao: data.descricao,
        icone: data.icone,
        ordem: data.ordem,
        totalEtapas: data.etapas.length,
        xpTotal: data.xpTotal,
        publicada: true,
      },
    })

    for (const etapa of data.etapas) {
      await prisma.etapa.upsert({
        where: { trilhaId_ordem: { trilhaId: trilha.id, ordem: etapa.ordem } },
        update: {
          tipo: etapa.tipo,
          titulo: etapa.titulo,
          conteudo: etapa.conteudo,
          xpReward: etapa.xpReward,
          temAnuncio: etapa.temAnuncio,
        },
        create: {
          trilhaId: trilha.id,
          ordem: etapa.ordem,
          tipo: etapa.tipo,
          titulo: etapa.titulo,
          conteudo: etapa.conteudo,
          xpReward: etapa.xpReward,
          temAnuncio: etapa.temAnuncio,
        },
      })
    }

    console.log(`✅ ${data.slug} (${data.etapas.length} etapas)`)
  }

  await prisma.$disconnect()
  console.log('\n✨ Seed concluído!')
}

seed().catch(e => {
  console.error(e)
  process.exit(1)
})
