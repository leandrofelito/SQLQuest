import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcularEstrelas, XP_POR_ESTRELAS, getLevel } from '@/lib/xp'
import { verificarConquistasRanking } from '@/lib/ranking-conquistas'
import { verificarToken } from '@/lib/validacao-token'
import { z } from 'zod'

const schema = z.object({
  trilhaId: z.string(),
  etapaId: z.string(),
  token: z.string(), // HMAC-signed token issued by /api/validar-query
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  const body = parsed.data

  // Verify the HMAC token — rejects any tampered or expired payload
  const payload = verificarToken(body.token)
  if (!payload || payload.userId !== userId || payload.etapaId !== body.etapaId) {
    return NextResponse.json({ error: 'Token de validação inválido ou expirado' }, { status: 403 })
  }

  // Use server-sealed values — the client cannot inflate tentativas or hide dicasUsadas
  const { tentativas, dicasUsadas } = payload

  const estrelas = calcularEstrelas(tentativas, dicasUsadas)
  const xpGanho = XP_POR_ESTRELAS[estrelas] ?? 30

  const existente = await prisma.progresso.findUnique({
    where: { userId_etapaId: { userId, etapaId: body.etapaId } },
  })


  let xpDelta = 0

  if (!existente) {
    // Primeira vez completando
    await prisma.progresso.create({
      data: {
        userId,
        trilhaId: body.trilhaId,
        etapaId: body.etapaId,
        xpGanho,
        tentativas,
        usouDica: dicasUsadas > 0,
        estrelas,
      },
    })
    xpDelta = xpGanho
  } else if (estrelas > existente.estrelas) {
    // Novo recorde — atualiza e concede apenas a diferença de XP
    xpDelta = xpGanho - existente.xpGanho
    await prisma.progresso.update({
      where: { userId_etapaId: { userId, etapaId: body.etapaId } },
      data: {
        xpGanho,
        tentativas,
        usouDica: dicasUsadas > 0,
        estrelas,
        concluidaEm: new Date(),
      },
    })
  } else {
    // Já feito com nota igual ou melhor
    return NextResponse.json({ xpGanho: 0, estrelas: existente.estrelas, jaFeito: true })
  }

  let nivelAnterior = 1
  let nivelAtual = 1

  if (xpDelta > 0) {
    const userBefore = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true },
    })
    nivelAnterior = getLevel(userBefore?.totalXp ?? 0)

    await prisma.user.update({
      where: { id: userId },
      data: { totalXp: { increment: xpDelta } },
    })

    nivelAtual = getLevel((userBefore?.totalXp ?? 0) + xpDelta)
  }

  const novasConquistasRanking = await verificarConquistasRanking(userId)

  const trilha = await prisma.trilha.findUnique({
    where: { id: body.trilhaId },
    include: { etapas: { select: { id: true, tipo: true } } },
  })
  const progressosTrilha = await prisma.progresso.findMany({
    where: { userId, trilhaId: body.trilhaId },
  })

  const exercicioIds = new Set(trilha?.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id) ?? [])
  const totalExercicios = exercicioIds.size
  const progressosExercicios = progressosTrilha.filter(p => exercicioIds.has(p.etapaId)).length

  let certificadoCriado = false
  if (trilha && totalExercicios > 0 && progressosExercicios >= totalExercicios) {
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

  return NextResponse.json({
    xpGanho: xpDelta,
    estrelas,
    certificadoCriado,
    novasConquistasRanking,
    nivelAnterior,
    nivelAtual,
  })
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
