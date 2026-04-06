import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { XP_EVENTOS } from '@/lib/xp'
import { z } from 'zod'

const schema = z.object({
  trilhaId: z.string(),
  etapaId: z.string(),
  usouDica: z.boolean().default(false),
  tentativas: z.number().default(1),
  primeiraTentativa: z.boolean().default(false),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = schema.parse(await req.json())
  const userId = (session.user as any).id

  const jaFeito = await prisma.progresso.findUnique({
    where: { userId_etapaId: { userId, etapaId: body.etapaId } },
  })
  if (jaFeito) return NextResponse.json({ xpGanho: 0, jaFeito: true })

  let xpGanho = XP_EVENTOS.etapa_correta
  if (body.primeiraTentativa) xpGanho += XP_EVENTOS.primeira_tentativa
  if (!body.usouDica) xpGanho += XP_EVENTOS.sem_dica

  await prisma.progresso.create({
    data: {
      userId,
      trilhaId: body.trilhaId,
      etapaId: body.etapaId,
      xpGanho,
      tentativas: body.tentativas,
      usouDica: body.usouDica,
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { totalXp: { increment: xpGanho } },
  })

  const trilha = await prisma.trilha.findUnique({
    where: { id: body.trilhaId },
    include: { etapas: { select: { id: true, tipo: true } } },
  })
  const progressosTrilha = await prisma.progresso.findMany({
    where: { userId, trilhaId: body.trilhaId },
  })

  // Conclusão ocorre quando todos os exercícios foram completados
  const totalExercicios = trilha?.etapas.filter(e => e.tipo === 'exercicio').length ?? 0

  let certificadoCriado = false
  if (trilha && totalExercicios > 0 && progressosTrilha.length >= totalExercicios) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.isPro) {
      const certExiste = await prisma.certificado.findUnique({
        where: { userId_trilhaId: { userId, trilhaId: body.trilhaId } },
      })
      if (!certExiste) {
        await prisma.certificado.create({ data: { userId, trilhaId: body.trilhaId } })
        certificadoCriado = true
      }
    }
  }

  return NextResponse.json({ xpGanho, certificadoCriado })
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const trilhaId = searchParams.get('trilhaId')

  const where = trilhaId ? { userId, trilhaId } : { userId }
  const progressos = await prisma.progresso.findMany({ where })
  return NextResponse.json(progressos)
}
