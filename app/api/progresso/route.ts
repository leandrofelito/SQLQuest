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
  let userBefore: { totalXp: number; isPro: boolean } | null = null

  if (xpDelta > 0) {
    userBefore = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, isPro: true },
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
    select: { slug: true, etapas: { select: { id: true, tipo: true } } },
  })
  const progressosTrilha = await prisma.progresso.findMany({
    where: { userId, trilhaId: body.trilhaId },
  })

  const exercicioIds = new Set(trilha?.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id) ?? [])
  const totalExercicios = exercicioIds.size
  const progressosExercicios = progressosTrilha.filter(p => exercicioIds.has(p.etapaId)).length

  let certificadoCriado = false
  if (trilha && totalExercicios > 0 && progressosExercicios >= totalExercicios) {
    const isProUser =
      userBefore?.isPro ??
      (await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } }))?.isPro ??
      false
    if (isProUser) {
      const certExiste = await prisma.certificado.findUnique({
        where: { userId_trilhaId: { userId, trilhaId: body.trilhaId } },
      })
      if (!certExiste) {
        await prisma.certificado.create({ data: { userId, trilhaId: body.trilhaId } })
        certificadoCriado = true
      }
    }
  }

  // ── Detectar conquistas recém-desbloqueadas ──────────────────────────────
  const novasConquistas: Array<{ id: string; emoji: string; nome: string }> = []

  if (xpDelta > 0) {
    const xpAnterior = userBefore?.totalXp ?? 0
    const xpNovo = xpAnterior + xpDelta

    // Marcos de XP
    const XP_MARCOS = [
      { id: 'xp_500',   xp: 500,   emoji: '⭐', nome: '500 XP' },
      { id: 'xp_2000',  xp: 2000,  emoji: '🌟', nome: 'Mil de XP' },
      { id: 'xp_5000',  xp: 5000,  emoji: '🏆', nome: 'SQL Veteran' },
      { id: 'xp_10000', xp: 10000, emoji: '💥', nome: 'SQL Legend' },
    ]
    for (const m of XP_MARCOS) {
      if (xpAnterior < m.xp && xpNovo >= m.xp) {
        novasConquistas.push({ id: m.id, emoji: m.emoji, nome: m.nome })
      }
    }

    // Marcos de nível
    const NIVEL_MARCOS: Record<number, { emoji: string; nome: string }> = {
      5:    { emoji: '🗂️', nome: 'Coletor de Dados' },
      10:   { emoji: '🔍', nome: 'Query Beginner' },
      15:   { emoji: '✅', nome: 'Sintaxe em Dia' },
      20:   { emoji: '🔒', nome: 'Guardião dos SELECTs' },
      25:   { emoji: '📊', nome: 'Analista de Queries' },
      30:   { emoji: '🎯', nome: 'Mestre dos Filtros' },
      35:   { emoji: '🔗', nome: 'Relacionista de Tabelas' },
      40:   { emoji: '⚡', nome: 'Indexador Profissional' },
      50:   { emoji: '🏆', nome: 'Cinquenta Levels' },
      60:   { emoji: '🏛️', nome: 'Arquiteto de Schemas' },
      70:   { emoji: '⚙️', nome: 'Otimizador de Índices' },
      80:   { emoji: '🛡️', nome: 'Segurança Máxima' },
      90:   { emoji: '🔮', nome: 'Mago do SQL' },
      100:  { emoji: '💯', nome: 'Centenário' },
      150:  { emoji: '🧙', nome: 'Oráculo do SQL' },
      200:  { emoji: '🌌', nome: 'Arquiteto do Universo' },
      250:  { emoji: '🌀', nome: 'Entidade de Dados' },
      300:  { emoji: '💠', nome: 'Lenda do Neon DB' },
      500:  { emoji: '♾️', nome: 'Imortal do SQL' },
      750:  { emoji: '◆',  nome: 'Supremo dos Dados' },
      1000: { emoji: '⚜️', nome: 'O Criador' },
    }
    for (const [nivelStr, conquista] of Object.entries(NIVEL_MARCOS)) {
      const nivel = Number(nivelStr)
      if (nivelAnterior < nivel && nivelAtual >= nivel) {
        novasConquistas.push({ id: `nivel_${nivel}`, ...conquista })
      }
    }
  }

  // Marcos de contagem de etapas (só se for nova conclusão)
  if (!existente) {
    const totalConcluidos = await prisma.progresso.count({
      where: { userId, xpGanho: { gt: 0 } },
    })
    const CONTAGEM_MARCOS = [
      { count: 1,  id: 'primeira_etapa', emoji: '⚡', nome: 'Primeiro Passo' },
      { count: 5,  id: 'etapas_5',       emoji: '🌱', nome: 'Primeiros Brotos' },
      { count: 20, id: 'etapas_20',      emoji: '📚', nome: 'Estudioso' },
      { count: 50, id: 'etapas_50',      emoji: '🏃', nome: 'Maratonista' },
    ]
    for (const m of CONTAGEM_MARCOS) {
      if (totalConcluidos === m.count) {
        novasConquistas.push({ id: m.id, emoji: m.emoji, nome: m.nome })
      }
    }
  }

  // Conquista de conclusão de trilha
  if (!existente && trilha) {
    const exercicioIdsConquista = new Set(trilha.etapas.filter(e => e.tipo === 'exercicio').map(e => e.id))
    const totalExerciciosConquista = exercicioIdsConquista.size
    const concluidosTrilha = progressosTrilha.filter(p => exercicioIdsConquista.has(p.etapaId)).length
    const TRILHA_CONQUISTAS: Record<string, { emoji: string; nome: string }> = {
      'fundamentos':              { emoji: '🗄️', nome: 'Fundamentos' },
      'select-basico':            { emoji: '🔍', nome: 'Explorador SELECT' },
      'joins':                    { emoji: '🔗', nome: 'Mestre dos JOINs' },
      'filtragem':                { emoji: '🔎', nome: 'Detetive SQL' },
      'groupby-having':           { emoji: '📊', nome: 'O Agregador' },
      'dml-dados':                { emoji: '✏️', nome: 'Mão na Massa' },
      'window-functions':         { emoji: '🪟', nome: 'Analista Avançado' },
      'indices':                  { emoji: '⚙️', nome: 'Otimizador' },
      'detetive-bi':              { emoji: '🕵️', nome: 'Detetive de Dados' },
      'performance-tuning':       { emoji: '⚡', nome: 'Mestre da Performance' },
      'seguranca-governanca':     { emoji: '🔐', nome: 'Guardião dos Dados' },
      'sql-para-devs':            { emoji: '💻', nome: 'Dev SQL' },
      'elite-tuning-performance': { emoji: '🏎️', nome: 'Piloto de Elite' },
    }
    if (
      totalExerciciosConquista > 0 &&
      concluidosTrilha >= totalExerciciosConquista &&
      trilha.slug in TRILHA_CONQUISTAS
    ) {
      novasConquistas.push({
        id: `trilha_${trilha.slug}`,
        ...TRILHA_CONQUISTAS[trilha.slug],
      })
    }
  }

  return NextResponse.json({
    xpGanho: xpDelta,
    estrelas,
    certificadoCriado,
    novasConquistasRanking,
    nivelAnterior,
    nivelAtual,
    novasConquistas,
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
