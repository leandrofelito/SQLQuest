import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const [progressos, certificados, dbUser] = await Promise.all([
    prisma.progresso.findMany({
      where: { userId },
      include: { trilha: { select: { slug: true } } },
    }),
    prisma.certificado.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true, streak: true, isPro: true } }),
  ])

  const totalXp = dbUser?.totalXp ?? 0
  const streak = dbUser?.streak ?? 0
  const isPro = dbUser?.isPro ?? false

  const etapasIds = new Set(progressos.map(p => p.etapaId))
  const usouDicaAlguma = progressos.some(p => p.usouDica)
  const algumNaDicaNaoPrimeira = progressos.some(p => !p.usouDica && p.tentativas === 1)
  const trilhaSlugs = new Set(progressos.map(p => p.trilha.slug))
  const semDicaAlguma = progressos.length > 0 && !progressos.some(p => p.usouDica)

  const conquistas = [
    {
      id: 'primeira_etapa',
      emoji: '⚡',
      nome: 'Primeiro Passo',
      desc: 'Complete a primeira etapa de qualquer trilha',
      desbloqueada: progressos.length >= 1,
    },
    {
      id: 'trilha_fundamentos',
      emoji: '🗄️',
      nome: 'Fundamentos',
      desc: 'Conclua a trilha Fundamentos do SQL',
      desbloqueada: trilhaSlugs.has('fundamentos') && progressos.filter(p => p.trilha.slug === 'fundamentos' && p.xpGanho > 0).length > 0,
    },
    {
      id: 'trilha_select',
      emoji: '🔍',
      nome: 'Explorador SELECT',
      desc: 'Conclua a trilha SELECT — Lendo Dados',
      desbloqueada: trilhaSlugs.has('select-basico'),
    },
    {
      id: 'trilha_joins',
      emoji: '🔗',
      nome: 'Mestre dos JOINs',
      desc: 'Conclua a trilha JOINs — Unindo Tabelas',
      desbloqueada: trilhaSlugs.has('joins'),
    },
    {
      id: 'sem_dica',
      emoji: '🧠',
      nome: 'Sem Ajuda',
      desc: 'Complete qualquer exercício na primeira tentativa sem usar dicas',
      desbloqueada: progressos.some(p => !p.usouDica && p.tentativas === 1 && p.xpGanho > 0),
    },
    {
      id: 'streak_3',
      emoji: '🔥',
      nome: 'Em Chamas',
      desc: 'Mantenha um streak de 3 dias consecutivos',
      desbloqueada: streak >= 3,
    },
    {
      id: 'streak_7',
      emoji: '💥',
      nome: 'Semana Firme',
      desc: 'Mantenha um streak de 7 dias consecutivos',
      desbloqueada: streak >= 7,
    },
    {
      id: 'xp_500',
      emoji: '⭐',
      nome: '500 XP',
      desc: 'Acumule 500 pontos de experiência',
      desbloqueada: totalXp >= 500,
    },
    {
      id: 'xp_2000',
      emoji: '🌟',
      nome: 'Mil de XP',
      desc: 'Acumule 2.000 pontos de experiência',
      desbloqueada: totalXp >= 2000,
    },
    {
      id: 'xp_5000',
      emoji: '🏆',
      nome: 'SQL Veteran',
      desc: 'Acumule 5.000 pontos de experiência',
      desbloqueada: totalXp >= 5000,
    },
    {
      id: 'pro',
      emoji: '💎',
      nome: 'Membro Pro',
      desc: 'Assine o plano Pro',
      desbloqueada: isPro,
    },
    {
      id: 'cert_1',
      emoji: '🏅',
      nome: 'Certificado',
      desc: 'Conquiste o primeiro certificado',
      desbloqueada: certificados.length >= 1,
    },
    {
      id: 'etapas_20',
      emoji: '📚',
      nome: 'Estudioso',
      desc: 'Complete 20 etapas no total',
      desbloqueada: progressos.filter(p => p.xpGanho > 0).length >= 20,
    },
    {
      id: 'window_fn',
      emoji: '🪟',
      nome: 'Analista Avançado',
      desc: 'Conclua a trilha Window Functions',
      desbloqueada: trilhaSlugs.has('window-functions'),
    },
    {
      id: 'dml',
      emoji: '✏️',
      nome: 'Mão na Massa',
      desc: 'Conclua a trilha INSERT, UPDATE e DELETE',
      desbloqueada: trilhaSlugs.has('dml-dados'),
    },
  ]

  return NextResponse.json(conquistas)
}
