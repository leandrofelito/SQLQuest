import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'
import fs from 'fs'
import path from 'path'

async function seed() {
  const dir = path.join(process.cwd(), 'content/trilhas')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()

  console.log(`\n🌱 Iniciando seed com ${files.length} trilhas...\n`)

  // Remove trilhas e etapas sem apagar dados de usuário (progressos ficam órfãos mas ok)
  console.log('🗑️  Limpando trilhas e etapas existentes...')
  await prisma.etapa.deleteMany()
  await prisma.trilha.deleteMany()
  console.log('✅ Limpeza concluída\n')

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))

    const trilha = await prisma.trilha.create({
      data: {
        slug: data.slug,
        titulo: data.titulo,
        descricao: data.descricao,
        icone: data.icone,
        ordem: data.ordem,
        totalEtapas: data.etapas.length,
        xpTotal: data.xpTotal,
        publicada: true,
        ...(data.traducoes ? { traducoes: data.traducoes } : {}),
      },
    })

    for (const etapa of data.etapas) {
      await prisma.etapa.create({
        data: {
          trilhaId: trilha.id,
          ordem: etapa.ordem,
          tipo: etapa.tipo,
          titulo: etapa.titulo,
          conteudo: etapa.conteudo,
          xpReward: etapa.xpReward,
          temAnuncio: etapa.temAnuncio,
          ...(etapa.traducoes ? { traducoes: etapa.traducoes } : {}),
        },
      })
    }

    console.log(`✅ ${data.titulo} (${data.etapas.length} etapas, ${data.xpTotal} XP)`)
  }

  await prisma.$disconnect()
  console.log('\n✨ Seed concluído!')
}

seed().catch(e => {
  console.error(e)
  process.exit(1)
})
