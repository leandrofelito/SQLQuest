import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const [progressos, certificados, dbUser, trilhas] = await Promise.all([
    prisma.progresso.findMany({
      where: { userId },
      include: { trilha: { select: { slug: true } } },
    }),
    prisma.certificado.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true, streak: true, isPro: true } }),
    prisma.trilha.findMany({ select: { slug: true, totalEtapas: true } }),
  ])

  const totalXp = dbUser?.totalXp ?? 0
  const streak = dbUser?.streak ?? 0
  const isPro = dbUser?.isPro ?? false

  const trilhaSlugs = new Set(progressos.map(p => p.trilha.slug))
  const concluidos = progressos.filter(p => p.xpGanho > 0)

  // Agrupa etapas concluídas por trilha
  const porTrilha: Record<string, typeof progressos> = {}
  for (const p of concluidos) {
    const slug = p.trilha.slug
    if (!porTrilha[slug]) porTrilha[slug] = []
    porTrilha[slug].push(p)
  }

  const totalEtapasPorTrilha = Object.fromEntries(trilhas.map(t => [t.slug, t.totalEtapas]))

  const estudouSegunda = concluidos.some(p => new Date(p.concluidaEm).getDay() === 1)
  const semDica10 = concluidos.filter(p => !p.usouDica).length >= 10
  const certeiro5 = concluidos.filter(p => p.tentativas === 1 && !p.usouDica).length >= 5
  const trilhaSemDica = Object.entries(porTrilha).some(([slug, ps]) =>
    ps.length >= (totalEtapasPorTrilha[slug] ?? Infinity) && ps.every(p => !p.usouDica)
  )
  const trilhaPerfeita = Object.entries(porTrilha).some(([slug, ps]) =>
    ps.length >= (totalEtapasPorTrilha[slug] ?? Infinity) && ps.every(p => !p.usouDica && p.tentativas === 1)
  )

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

    // --- Fáceis (Retenção) ---
    {
      id: 'etapas_5',
      emoji: '🌱',
      nome: 'Primeiros Brotos',
      desc: 'Complete 5 etapas no total',
      desbloqueada: concluidos.length >= 5,
    },
    {
      id: 'segunda_feira',
      emoji: '📅',
      nome: 'Estudioso de Segunda',
      desc: 'Complete qualquer etapa numa segunda-feira',
      desbloqueada: estudouSegunda,
    },
    {
      id: 'trilha_filtragem',
      emoji: '🔎',
      nome: 'Detetive SQL',
      desc: 'Conclua a trilha WHERE e Filtragem',
      desbloqueada: trilhaSlugs.has('filtragem'),
    },
    {
      id: 'streak_14',
      emoji: '🌊',
      nome: 'Duas Semanas',
      desc: 'Mantenha um streak de 14 dias consecutivos',
      desbloqueada: streak >= 14,
    },

    // --- Médias (Habilidade) ---
    {
      id: 'trilha_groupby',
      emoji: '📊',
      nome: 'O Agregador',
      desc: 'Conclua a trilha GROUP BY e HAVING',
      desbloqueada: trilhaSlugs.has('groupby-having'),
    },
    {
      id: 'trilhas_5',
      emoji: '🗺️',
      nome: 'Explorador',
      desc: 'Conclua 5 trilhas diferentes',
      desbloqueada: trilhaSlugs.size >= 5,
    },
    {
      id: 'sem_dica_10',
      emoji: '🧠',
      nome: 'Mente Afiada',
      desc: 'Complete 10 etapas sem usar nenhuma dica',
      desbloqueada: semDica10,
    },
    {
      id: 'certeiro_5',
      emoji: '🎯',
      nome: 'Certeiro',
      desc: 'Acerte 5 etapas diferentes na primeira tentativa sem dica',
      desbloqueada: certeiro5,
    },

    // --- Difíceis (Desafio) ---
    {
      id: 'trilha_indices',
      emoji: '⚙️',
      nome: 'Otimizador',
      desc: 'Conclua a trilha Índices — Performance SQL',
      desbloqueada: trilhaSlugs.has('indices'),
    },
    {
      id: 'etapas_50',
      emoji: '🏃',
      nome: 'Maratonista',
      desc: 'Complete 50 etapas no total',
      desbloqueada: concluidos.length >= 50,
    },
    {
      id: 'trilha_sem_dica',
      emoji: '🛡️',
      nome: 'Zero Erros',
      desc: 'Conclua qualquer trilha inteira sem usar nenhuma dica',
      desbloqueada: trilhaSemDica,
    },
    {
      id: 'streak_30',
      emoji: '🌙',
      nome: 'Mês Dedicado',
      desc: 'Mantenha um streak de 30 dias consecutivos',
      desbloqueada: streak >= 30,
    },

    // --- Lendárias (Quase Impossíveis) ---
    {
      id: 'cert_10',
      emoji: '🏆',
      nome: 'Mestre Certificado',
      desc: 'Conquiste certificados em 10 trilhas diferentes',
      desbloqueada: certificados.length >= 10,
    },
    {
      id: 'trilha_perfeita',
      emoji: '💎',
      nome: 'Perfeccionista',
      desc: 'Conclua qualquer trilha inteira na primeira tentativa, sem nenhuma dica',
      desbloqueada: trilhaPerfeita,
    },
    {
      id: 'data_god',
      emoji: '👑',
      nome: 'Data God',
      desc: 'Conclua todas as trilhas do SQLQuest (100% do conteúdo)',
      desbloqueada: trilhaSlugs.size >= 21,
    },
  ]

  return NextResponse.json(conquistas)
}
