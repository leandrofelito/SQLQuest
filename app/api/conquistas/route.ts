import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { RANKING_CONQUISTAS, getConquistasRankingUsuario } from '@/lib/ranking-conquistas'
import { getLevel, LEVEL_MILESTONES } from '@/lib/xp'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const [progressos, certificados, dbUser, trilhas, conquistasRanking] = await Promise.all([
    prisma.progresso.findMany({
      where: { userId },
      include: { trilha: { select: { slug: true } } },
    }),
    prisma.certificado.findMany({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, streak: true, isPro: true, prestige: true },
    }),
    prisma.trilha.findMany({
      select: { slug: true, totalEtapas: true, etapas: { select: { tipo: true } } },
    }),
    getConquistasRankingUsuario(userId),
  ])

  const rankingDesbloqueados = new Set(conquistasRanking.map(c => c.tipo))

  const totalXp = dbUser?.totalXp ?? 0
  const streak = dbUser?.streak ?? 0
  const isPro = dbUser?.isPro ?? false
  const prestige = dbUser?.prestige ?? 0
  const nivelAtual = getLevel(totalXp)

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
  // Conta apenas exercícios por trilha
  const exerciciosPorTrilha = Object.fromEntries(
    trilhas.map(t => [t.slug, t.etapas.filter(e => e.tipo === 'exercicio').length])
  )

  const estudouSegunda = concluidos.some(p => new Date(p.concluidaEm).getDay() === 1)
  const semDica10 = concluidos.filter(p => !p.usouDica).length >= 10
  const certeiro5 = concluidos.filter(p => p.tentativas === 1 && !p.usouDica).length >= 5
  const trilhaSemDica = Object.entries(porTrilha).some(([slug, ps]) =>
    ps.length >= (totalEtapasPorTrilha[slug] ?? Infinity) && ps.every(p => !p.usouDica)
  )
  const trilhaPerfeita = Object.entries(porTrilha).some(([slug, ps]) =>
    ps.length >= (totalEtapasPorTrilha[slug] ?? Infinity) && ps.every(p => !p.usouDica && p.tentativas === 1)
  )

  // Novas conquistas (existentes)
  const noturnoPlantas = concluidos.some(p => new Date(p.concluidaEm).getHours() >= 22)
  const cirurgiaoDados = trilhaSlugs.has('dml-dados') && concluidos.some(p => p.trilha.slug === 'dml-dados')
  const joinsPerfeito = (() => {
    const ps = porTrilha['joins'] ?? []
    return ps.length >= (totalEtapasPorTrilha['joins'] ?? Infinity) && ps.every(p => !p.usouDica)
  })()
  const normalizacaoPerfeita = (() => {
    const ps = porTrilha['sql-para-devs'] ?? []
    return ps.length >= (totalEtapasPorTrilha['sql-para-devs'] ?? Infinity) && ps.every(p => !p.usouDica && p.tentativas === 1)
  })()

  // ── Conquistas de Platina (3 estrelas em todos os exercícios de uma trilha) ─
  function platinaCheck(slug: string): boolean {
    const ps = porTrilha[slug] ?? []
    const total = exerciciosPorTrilha[slug] ?? 0
    return total > 0 && ps.length >= total && ps.every(p => p.estrelas === 3)
  }

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
      desbloqueada: trilhaSlugs.size >= 22,
    },

    // ── Conquistas existentes ────────────────────────────────────────────────

    {
      id: 'cirurgiao_dados',
      emoji: '🔪',
      nome: 'Cirurgião de Dados',
      desc: 'Complete pelo menos uma etapa da trilha INSERT, UPDATE e DELETE',
      desbloqueada: cirurgiaoDados,
    },
    {
      id: 'noite_plantao',
      emoji: '🌙',
      nome: 'Noite de Plantão',
      desc: 'Resolva qualquer exercício após as 22h',
      desbloqueada: noturnoPlantas,
    },
    {
      id: 'trilhas_10',
      emoji: '🗺️',
      nome: 'Decatleta SQL',
      desc: 'Conclua 10 trilhas diferentes',
      desbloqueada: trilhaSlugs.size >= 10,
    },
    {
      id: 'xp_10000',
      emoji: '💥',
      nome: 'SQL Legend',
      desc: 'Acumule 10.000 pontos de experiência',
      desbloqueada: totalXp >= 10000,
    },
    {
      id: 'detetive_bi',
      emoji: '🕵️',
      nome: 'Detetive de Dados',
      desc: 'Conclua a trilha Detetive de Dados (BI, Joins complexos e Window Functions)',
      desbloqueada: trilhaSlugs.has('detetive-bi'),
    },
    {
      id: 'mestre_performance',
      emoji: '⚡',
      nome: 'Mestre da Performance',
      desc: 'Conclua a trilha Mestre da Performance (Tuning, Índices e EXPLAIN ANALYZE)',
      desbloqueada: trilhaSlugs.has('performance-tuning'),
    },
    {
      id: 'guardiao_dados',
      emoji: '🔐',
      nome: 'Guardião dos Dados',
      desc: 'Conclua a trilha Segurança e Governança (Roles, Triggers e LGPD)',
      desbloqueada: trilhaSlugs.has('seguranca-governanca'),
    },
    {
      id: 'dev_sql_full',
      emoji: '💻',
      nome: 'Dev SQL',
      desc: 'Conclua a trilha SQL para Desenvolvedores (DDL, DML e JSONB)',
      desbloqueada: trilhaSlugs.has('sql-para-devs'),
    },
    {
      id: 'inevitavel',
      emoji: '🏹',
      nome: 'O Inevitável',
      desc: 'Conclua a trilha JOINs inteira sem usar nenhuma dica',
      desbloqueada: joinsPerfeito,
    },
    {
      id: 'arquiteto_supremo',
      emoji: '🏛️',
      nome: 'Arquiteto Supremo',
      desc: 'Conclua a trilha SQL para Desenvolvedores inteira na primeira tentativa, sem dicas',
      desbloqueada: normalizacaoPerfeita,
    },

    // ── Conquistas de Nível (Iniciante 5-20) ────────────────────────────────
    {
      id: 'nivel_5',
      emoji: '🗂️',
      nome: 'Coletor de Dados',
      desc: 'Atingir o Nível 5 — você está colhendo os dados certos!',
      desbloqueada: nivelAtual >= 5,
      categoria: 'nivel',
      marcoNivel: 5,
    },
    {
      id: 'nivel_10',
      emoji: '🔍',
      nome: 'Query Beginner',
      desc: 'Atingir o Nível 10 — suas queries já têm propósito.',
      desbloqueada: nivelAtual >= 10,
      categoria: 'nivel',
      marcoNivel: 10,
    },
    {
      id: 'nivel_15',
      emoji: '✅',
      nome: 'Sintaxe em Dia',
      desc: 'Atingir o Nível 15 — a sintaxe já está na ponta dos dedos.',
      desbloqueada: nivelAtual >= 15,
      categoria: 'nivel',
      marcoNivel: 15,
    },
    {
      id: 'nivel_20',
      emoji: '🔒',
      nome: 'Guardião dos SELECTs',
      desc: 'Atingir o Nível 20 — você domina a arte de ler dados.',
      desbloqueada: nivelAtual >= 20,
      categoria: 'nivel',
      marcoNivel: 20,
    },

    // ── Conquistas de Nível (Intermediário 21-50) ────────────────────────────
    {
      id: 'nivel_25',
      emoji: '📊',
      nome: 'Analista de Queries',
      desc: 'Atingir o Nível 25 — você analisa dados como um profissional.',
      desbloqueada: nivelAtual >= 25,
      categoria: 'nivel',
      marcoNivel: 25,
    },
    {
      id: 'nivel_30',
      emoji: '🎯',
      nome: 'Mestre dos Filtros',
      desc: 'Atingir o Nível 30 — WHERE é seu melhor amigo.',
      desbloqueada: nivelAtual >= 30,
      categoria: 'nivel',
      marcoNivel: 30,
    },
    {
      id: 'nivel_35',
      emoji: '🔗',
      nome: 'Relacionista de Tabelas',
      desc: 'Atingir o Nível 35 — você conecta tabelas com elegância.',
      desbloqueada: nivelAtual >= 35,
      categoria: 'nivel',
      marcoNivel: 35,
    },
    {
      id: 'nivel_40',
      emoji: '⚡',
      nome: 'Indexador Profissional',
      desc: 'Atingir o Nível 40 — performance é sua obsessão.',
      desbloqueada: nivelAtual >= 40,
      categoria: 'nivel',
      marcoNivel: 40,
    },
    {
      id: 'nivel_50',
      emoji: '🏆',
      nome: 'Cinquenta Levels',
      desc: 'Atingir o Nível 50 — metade do caminho para a lenda.',
      desbloqueada: nivelAtual >= 50,
      categoria: 'nivel',
      marcoNivel: 50,
    },

    // ── Conquistas de Nível (Avançado 51-100) ───────────────────────────────
    {
      id: 'nivel_60',
      emoji: '🏛️',
      nome: 'Arquiteto de Schemas',
      desc: 'Atingir o Nível 60 — você projeta bancos de dados como estruturas.',
      desbloqueada: nivelAtual >= 60,
      categoria: 'nivel',
      marcoNivel: 60,
    },
    {
      id: 'nivel_70',
      emoji: '⚙️',
      nome: 'Otimizador de Índices',
      desc: 'Atingir o Nível 70 — EXPLAIN ANALYZE não tem segredos para você.',
      desbloqueada: nivelAtual >= 70,
      categoria: 'nivel',
      marcoNivel: 70,
    },
    {
      id: 'nivel_80',
      emoji: '🛡️',
      nome: 'Segurança Máxima',
      desc: 'Atingir o Nível 80 — você garante a integridade dos dados.',
      desbloqueada: nivelAtual >= 80,
      categoria: 'nivel',
      marcoNivel: 80,
    },
    {
      id: 'nivel_90',
      emoji: '🔮',
      nome: 'Mago do SQL',
      desc: 'Atingir o Nível 90 — você escreve feitiços em SQL.',
      desbloqueada: nivelAtual >= 90,
      categoria: 'nivel',
      marcoNivel: 90,
    },
    {
      id: 'nivel_100',
      emoji: '💯',
      nome: 'Centenário',
      desc: 'Atingir o Nível 100 — um marco histórico no SQLQuest!',
      desbloqueada: nivelAtual >= 100,
      categoria: 'nivel',
      marcoNivel: 100,
    },

    // ── Conquistas de Nível (Expert/Lendário 101-500) ────────────────────────
    {
      id: 'nivel_150',
      emoji: '🧙',
      nome: 'Oráculo do SQL',
      desc: 'Atingir o Nível 150 — você vê o futuro dos dados.',
      desbloqueada: nivelAtual >= 150,
      categoria: 'nivel',
      marcoNivel: 150,
    },
    {
      id: 'nivel_200',
      emoji: '🌌',
      nome: 'Arquiteto do Universo',
      desc: 'Atingir o Nível 200 — duas centenas de nível puro.',
      desbloqueada: nivelAtual >= 200,
      categoria: 'nivel',
      marcoNivel: 200,
    },
    {
      id: 'nivel_250',
      emoji: '🌀',
      nome: 'Entidade de Dados',
      desc: 'Atingir o Nível 250 — você transcende o SQL comum.',
      desbloqueada: nivelAtual >= 250,
      categoria: 'nivel',
      marcoNivel: 250,
    },
    {
      id: 'nivel_300',
      emoji: '💠',
      nome: 'Lenda do Neon DB',
      desc: 'Atingir o Nível 300 — lenda viva do Neon Database.',
      desbloqueada: nivelAtual >= 300,
      categoria: 'nivel',
      marcoNivel: 300,
    },
    {
      id: 'nivel_500',
      emoji: '♾️',
      nome: 'Imortal do SQL',
      desc: 'Atingir o Nível 500 — existência além do SQL mortal.',
      desbloqueada: nivelAtual >= 500,
      categoria: 'nivel',
      marcoNivel: 500,
    },
    {
      id: 'nivel_750',
      emoji: '◆',
      nome: 'Supremo dos Dados',
      desc: 'Atingir o Nível 750 — você transcendeu o conceito de banco de dados.',
      desbloqueada: nivelAtual >= 750,
      categoria: 'nivel',
      marcoNivel: 750,
    },
    {
      id: 'nivel_1000',
      emoji: '⚜️',
      nome: 'O Criador',
      desc: 'Atingir o Nível 1000 — marco absoluto. Você é o SQLQuest.',
      desbloqueada: nivelAtual >= 1000,
      categoria: 'nivel',
      marcoNivel: 1000,
    },

    // ── Conquistas de Prestígio ──────────────────────────────────────────────
    {
      id: 'prestige_1',
      emoji: '✨',
      nome: 'Primeiro Prestígio',
      desc: 'Resete para o Nível 1 após atingir o Nível 100 e ganhe a Estrela de Prestígio.',
      desbloqueada: prestige >= 1,
      categoria: 'prestige',
    },
    {
      id: 'prestige_5',
      emoji: '🌠',
      nome: 'Veterano do Prestígio',
      desc: 'Alcance o Prestígio 5 — cinco jornadas completas do Nível 1 ao 100.',
      desbloqueada: prestige >= 5,
      categoria: 'prestige',
    },

    // ── Conquistas de Elite ──────────────────────────────────────────────────
    {
      id: 'trilha_elite',
      emoji: '🏎️',
      nome: 'Piloto de Elite',
      desc: 'Conclua a trilha Desafios de Elite: Tuning e Performance',
      desbloqueada: trilhaSlugs.has('elite-tuning-performance'),
    },
    {
      id: 'escovador_bits',
      lucideIcon: 'Cpu',
      emoji: '🖥️',
      nome: 'Escovador de Bits',
      desc: 'Conclua os Desafios de Elite com 3 estrelas em todos os exercícios',
      desbloqueada: platinaCheck('elite-tuning-performance'),
      categoria: 'elite',
    },

    // ── Conquistas de Platina (3 estrelas em todos os exercícios) ────────────
    {
      id: 'platina_fundamentos',
      emoji: '💿',
      nome: 'Platinador de Fundamentos',
      desc: 'Obtenha 3 estrelas em todos os exercícios da trilha Fundamentos do SQL.',
      desbloqueada: platinaCheck('fundamentos'),
      categoria: 'platina',
    },
    {
      id: 'platina_select',
      emoji: '💿',
      nome: 'Platinador de SELECT',
      desc: 'Obtenha 3 estrelas em todos os exercícios da trilha SELECT — Lendo Dados.',
      desbloqueada: platinaCheck('select-basico'),
      categoria: 'platina',
    },
    {
      id: 'platina_filtragem',
      emoji: '💿',
      nome: 'Platinador de Filtragem',
      desc: 'Obtenha 3 estrelas em todos os exercícios da trilha WHERE e Filtragem.',
      desbloqueada: platinaCheck('filtragem'),
      categoria: 'platina',
    },
    {
      id: 'platina_joins',
      emoji: '💿',
      nome: 'Platinador de JOINs',
      desc: 'Obtenha 3 estrelas em todos os exercícios da trilha JOINs — Unindo Tabelas.',
      desbloqueada: platinaCheck('joins'),
      categoria: 'platina',
    },
    {
      id: 'platina_groupby',
      emoji: '💿',
      nome: 'Platinador de Agrupamento',
      desc: 'Obtenha 3 estrelas em todos os exercícios da trilha GROUP BY e HAVING.',
      desbloqueada: platinaCheck('groupby-having'),
      categoria: 'platina',
    },
    {
      id: 'platina_dml',
      emoji: '💿',
      nome: 'Platinador de DML',
      desc: 'Obtenha 3 estrelas em todos os exercícios da trilha INSERT, UPDATE e DELETE.',
      desbloqueada: platinaCheck('dml-dados'),
      categoria: 'platina',
    },
  ]

  const conquistasRankingFormatadas = RANKING_CONQUISTAS.map(rc => {
    const registro = conquistasRanking.find(c => c.tipo === rc.tipo)
    return {
      id: `ranking_${rc.tipo}`,
      emoji: rc.emoji,
      nome: rc.nome,
      desc: rc.desc,
      desbloqueada: rankingDesbloqueados.has(rc.tipo),
      alcancadaEm: registro?.alcancadaEm ?? null,
      posicao: registro?.posicao ?? null,
      tier: rc.tipo,
    }
  })

  return NextResponse.json([...conquistas, ...conquistasRankingFormatadas])
}
