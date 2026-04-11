import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getRankingConquistasLocalizadas, getConquistasRankingUsuario } from '@/lib/ranking-conquistas'
import { getLevel, LEVEL_MILESTONES } from '@/lib/xp'
import { COOKIE_NAME } from '@/lib/locale'

// Traduções EN e ES para todas as conquistas (PT é o valor base no array)
const CONQUISTAS_I18N: Record<string, Record<string, { nome: string; desc: string }>> = {
  primeira_etapa: {
    en: { nome: 'First Step', desc: 'Complete the first step of any trail' },
    es: { nome: 'Primer Paso', desc: 'Completa el primer paso de cualquier ruta' },
  },
  trilha_fundamentos: {
    en: { nome: 'Fundamentals', desc: 'Complete the SQL Fundamentals trail' },
    es: { nome: 'Fundamentos', desc: 'Completa la ruta Fundamentos de SQL' },
  },
  trilha_select: {
    en: { nome: 'SELECT Explorer', desc: 'Complete the SELECT — Reading Data trail' },
    es: { nome: 'Explorador SELECT', desc: 'Completa la ruta SELECT — Leyendo Datos' },
  },
  trilha_joins: {
    en: { nome: 'JOINs Master', desc: 'Complete the JOINs — Joining Tables trail' },
    es: { nome: 'Maestro de JOINs', desc: 'Completa la ruta JOINs — Uniendo Tablas' },
  },
  sem_dica: {
    en: { nome: 'No Help', desc: 'Complete any exercise on the first try without hints' },
    es: { nome: 'Sin Ayuda', desc: 'Completa cualquier ejercicio en el primer intento sin pistas' },
  },
  streak_3: {
    en: { nome: 'On Fire', desc: 'Maintain a 3-day consecutive streak' },
    es: { nome: 'En Llamas', desc: 'Mantén una racha de 3 días consecutivos' },
  },
  streak_7: {
    en: { nome: 'Solid Week', desc: 'Maintain a 7-day consecutive streak' },
    es: { nome: 'Semana Sólida', desc: 'Mantén una racha de 7 días consecutivos' },
  },
  xp_500: {
    en: { nome: '500 XP', desc: 'Accumulate 500 experience points' },
    es: { nome: '500 XP', desc: 'Acumula 500 puntos de experiencia' },
  },
  xp_2000: {
    en: { nome: '2K XP', desc: 'Accumulate 2,000 experience points' },
    es: { nome: '2K XP', desc: 'Acumula 2.000 puntos de experiencia' },
  },
  xp_5000: {
    en: { nome: 'SQL Veteran', desc: 'Accumulate 5,000 experience points' },
    es: { nome: 'Veterano SQL', desc: 'Acumula 5.000 puntos de experiencia' },
  },
  pro: {
    en: { nome: 'Pro Member', desc: 'Subscribe to the Pro plan' },
    es: { nome: 'Miembro Pro', desc: 'Suscríbete al plan Pro' },
  },
  cert_1: {
    en: { nome: 'Certificate', desc: 'Earn your first certificate' },
    es: { nome: 'Certificado', desc: 'Obtén tu primer certificado' },
  },
  etapas_20: {
    en: { nome: 'Studious', desc: 'Complete 20 steps in total' },
    es: { nome: 'Estudioso', desc: 'Completa 20 pasos en total' },
  },
  window_fn: {
    en: { nome: 'Advanced Analyst', desc: 'Complete the Window Functions trail' },
    es: { nome: 'Analista Avanzado', desc: 'Completa la ruta Window Functions' },
  },
  dml: {
    en: { nome: 'Hands On', desc: 'Complete the INSERT, UPDATE and DELETE trail' },
    es: { nome: 'Manos a la Obra', desc: 'Completa la ruta INSERT, UPDATE y DELETE' },
  },
  etapas_5: {
    en: { nome: 'First Sprouts', desc: 'Complete 5 steps in total' },
    es: { nome: 'Primeros Brotes', desc: 'Completa 5 pasos en total' },
  },
  segunda_feira: {
    en: { nome: 'Monday Studier', desc: 'Complete any step on a Monday' },
    es: { nome: 'Estudioso del Lunes', desc: 'Completa cualquier paso un lunes' },
  },
  trilha_filtragem: {
    en: { nome: 'SQL Detective', desc: 'Complete the WHERE and Filtering trail' },
    es: { nome: 'Detective SQL', desc: 'Completa la ruta WHERE y Filtrado' },
  },
  streak_14: {
    en: { nome: 'Two Weeks', desc: 'Maintain a 14-day consecutive streak' },
    es: { nome: 'Dos Semanas', desc: 'Mantén una racha de 14 días consecutivos' },
  },
  trilha_groupby: {
    en: { nome: 'The Aggregator', desc: 'Complete the GROUP BY and HAVING trail' },
    es: { nome: 'El Agregador', desc: 'Completa la ruta GROUP BY y HAVING' },
  },
  trilhas_5: {
    en: { nome: 'Explorer', desc: 'Complete 5 different trails' },
    es: { nome: 'Explorador', desc: 'Completa 5 rutas diferentes' },
  },
  sem_dica_10: {
    en: { nome: 'Sharp Mind', desc: 'Complete 10 steps without using any hints' },
    es: { nome: 'Mente Aguda', desc: 'Completa 10 pasos sin usar ninguna pista' },
  },
  certeiro_5: {
    en: { nome: 'Sharpshooter', desc: 'Nail 5 different steps on the first try without hints' },
    es: { nome: 'Certero', desc: 'Acierta 5 pasos diferentes en el primer intento sin pistas' },
  },
  trilha_indices: {
    en: { nome: 'Optimizer', desc: 'Complete the Indexes — SQL Performance trail' },
    es: { nome: 'Optimizador', desc: 'Completa la ruta Índices — Rendimiento SQL' },
  },
  etapas_50: {
    en: { nome: 'Marathon Runner', desc: 'Complete 50 steps in total' },
    es: { nome: 'Maratonista', desc: 'Completa 50 pasos en total' },
  },
  trilha_sem_dica: {
    en: { nome: 'Zero Mistakes', desc: 'Complete any full trail without using any hints' },
    es: { nome: 'Cero Errores', desc: 'Completa cualquier ruta completa sin usar ninguna pista' },
  },
  streak_30: {
    en: { nome: 'Dedicated Month', desc: 'Maintain a 30-day consecutive streak' },
    es: { nome: 'Mes Dedicado', desc: 'Mantén una racha de 30 días consecutivos' },
  },
  cert_10: {
    en: { nome: 'Certified Master', desc: 'Earn certificates in 10 different trails' },
    es: { nome: 'Maestro Certificado', desc: 'Obtén certificados en 10 rutas diferentes' },
  },
  trilha_perfeita: {
    en: { nome: 'Perfectionist', desc: 'Complete any full trail on the first try, without any hints' },
    es: { nome: 'Perfeccionista', desc: 'Completa cualquier ruta completa en el primer intento, sin pistas' },
  },
  data_god: {
    en: { nome: 'Data God', desc: 'Complete all SQLQuest trails (100% of content)' },
    es: { nome: 'Dios de Datos', desc: 'Completa todas las rutas de SQLQuest (100% del contenido)' },
  },
  cirurgiao_dados: {
    en: { nome: 'Data Surgeon', desc: 'Complete at least one step of the INSERT, UPDATE and DELETE trail' },
    es: { nome: 'Cirujano de Datos', desc: 'Completa al menos un paso de la ruta INSERT, UPDATE y DELETE' },
  },
  noite_plantao: {
    en: { nome: 'Night Shift', desc: 'Solve any exercise after 10 PM' },
    es: { nome: 'Turno de Noche', desc: 'Resuelve cualquier ejercicio después de las 22h' },
  },
  trilhas_10: {
    en: { nome: 'SQL Decathlete', desc: 'Complete 10 different trails' },
    es: { nome: 'Decatleta SQL', desc: 'Completa 10 rutas diferentes' },
  },
  xp_10000: {
    en: { nome: 'SQL Legend', desc: 'Accumulate 10,000 experience points' },
    es: { nome: 'Leyenda SQL', desc: 'Acumula 10.000 puntos de experiencia' },
  },
  detetive_bi: {
    en: { nome: 'Data Detective', desc: 'Complete the Data Detective trail (BI, complex Joins and Window Functions)' },
    es: { nome: 'Detective de Datos', desc: 'Completa la ruta Detective de Datos (BI, Joins complejos y Window Functions)' },
  },
  mestre_performance: {
    en: { nome: 'Performance Master', desc: 'Complete the Performance Master trail (Tuning, Indexes and EXPLAIN ANALYZE)' },
    es: { nome: 'Maestro del Rendimiento', desc: 'Completa la ruta Maestro del Rendimiento (Tuning, Índices y EXPLAIN ANALYZE)' },
  },
  guardiao_dados: {
    en: { nome: 'Data Guardian', desc: 'Complete the Security and Governance trail (Roles, Triggers and LGPD)' },
    es: { nome: 'Guardián de Datos', desc: 'Completa la ruta Seguridad y Gobernanza (Roles, Triggers y LGPD)' },
  },
  dev_sql_full: {
    en: { nome: 'SQL Dev', desc: 'Complete the SQL for Developers trail (DDL, DML and JSONB)' },
    es: { nome: 'Dev SQL', desc: 'Completa la ruta SQL para Desarrolladores (DDL, DML y JSONB)' },
  },
  inevitavel: {
    en: { nome: 'The Inevitable', desc: 'Complete the entire JOINs trail without any hints' },
    es: { nome: 'El Inevitable', desc: 'Completa la ruta JOINs completa sin usar ninguna pista' },
  },
  arquiteto_supremo: {
    en: { nome: 'Supreme Architect', desc: 'Complete the SQL for Developers trail on the first try, without hints' },
    es: { nome: 'Arquitecto Supremo', desc: 'Completa la ruta SQL para Desarrolladores en el primer intento, sin pistas' },
  },
  nivel_5: {
    en: { nome: 'Data Collector', desc: 'Reach Level 5 — you are collecting the right data!' },
    es: { nome: 'Recolector de Datos', desc: '¡Alcanza el Nivel 5 — estás recopilando los datos correctos!' },
  },
  nivel_10: {
    en: { nome: 'Query Beginner', desc: 'Reach Level 10 — your queries already have purpose.' },
    es: { nome: 'Query Principiante', desc: 'Alcanza el Nivel 10 — tus queries ya tienen propósito.' },
  },
  nivel_15: {
    en: { nome: 'Syntax on Point', desc: 'Reach Level 15 — syntax is at your fingertips.' },
    es: { nome: 'Sintaxis Dominada', desc: 'Alcanza el Nivel 15 — la sintaxis está en la punta de los dedos.' },
  },
  nivel_20: {
    en: { nome: 'SELECT Guardian', desc: 'Reach Level 20 — you master the art of reading data.' },
    es: { nome: 'Guardián de SELECTs', desc: 'Alcanza el Nivel 20 — dominas el arte de leer datos.' },
  },
  nivel_25: {
    en: { nome: 'Query Analyst', desc: 'Reach Level 25 — you analyze data like a professional.' },
    es: { nome: 'Analista de Queries', desc: 'Alcanza el Nivel 25 — analizas datos como un profesional.' },
  },
  nivel_30: {
    en: { nome: 'Filter Master', desc: 'Reach Level 30 — WHERE is your best friend.' },
    es: { nome: 'Maestro de Filtros', desc: 'Alcanza el Nivel 30 — WHERE es tu mejor amigo.' },
  },
  nivel_35: {
    en: { nome: 'Table Connector', desc: 'Reach Level 35 — you connect tables with elegance.' },
    es: { nome: 'Conector de Tablas', desc: 'Alcanza el Nivel 35 — conectas tablas con elegancia.' },
  },
  nivel_40: {
    en: { nome: 'Pro Indexer', desc: 'Reach Level 40 — performance is your obsession.' },
    es: { nome: 'Indexador Profesional', desc: 'Alcanza el Nivel 40 — el rendimiento es tu obsesión.' },
  },
  nivel_50: {
    en: { nome: 'Fifty Levels', desc: 'Reach Level 50 — halfway to legend.' },
    es: { nome: 'Cincuenta Niveles', desc: 'Alcanza el Nivel 50 — a mitad del camino hacia la leyenda.' },
  },
  nivel_60: {
    en: { nome: 'Schema Architect', desc: 'Reach Level 60 — you design databases like structures.' },
    es: { nome: 'Arquitecto de Schemas', desc: 'Alcanza el Nivel 60 — diseñas bases de datos como estructuras.' },
  },
  nivel_70: {
    en: { nome: 'Index Optimizer', desc: 'Reach Level 70 — EXPLAIN ANALYZE holds no secrets for you.' },
    es: { nome: 'Optimizador de Índices', desc: 'Alcanza el Nivel 70 — EXPLAIN ANALYZE no tiene secretos para ti.' },
  },
  nivel_80: {
    en: { nome: 'Maximum Security', desc: 'Reach Level 80 — you ensure data integrity.' },
    es: { nome: 'Seguridad Máxima', desc: 'Alcanza el Nivel 80 — garantizas la integridad de los datos.' },
  },
  nivel_90: {
    en: { nome: 'SQL Wizard', desc: 'Reach Level 90 — you write spells in SQL.' },
    es: { nome: 'Mago del SQL', desc: 'Alcanza el Nivel 90 — escribes hechizos en SQL.' },
  },
  nivel_100: {
    en: { nome: 'Centenary', desc: 'Reach Level 100 — a historic milestone in SQLQuest!' },
    es: { nome: 'Centenario', desc: 'Alcanza el Nivel 100 — ¡un hito histórico en SQLQuest!' },
  },
  nivel_150: {
    en: { nome: 'SQL Oracle', desc: 'Reach Level 150 — you see the future of data.' },
    es: { nome: 'Oráculo SQL', desc: 'Alcanza el Nivel 150 — ves el futuro de los datos.' },
  },
  nivel_200: {
    en: { nome: 'Universe Architect', desc: 'Reach Level 200 — two hundred levels of pure power.' },
    es: { nome: 'Arquitecto del Universo', desc: 'Alcanza el Nivel 200 — doscientos niveles de poder puro.' },
  },
  nivel_250: {
    en: { nome: 'Data Entity', desc: 'Reach Level 250 — you transcend common SQL.' },
    es: { nome: 'Entidad de Datos', desc: 'Alcanza el Nivel 250 — trasciendes el SQL común.' },
  },
  nivel_300: {
    en: { nome: 'Neon DB Legend', desc: 'Reach Level 300 — living legend of Neon Database.' },
    es: { nome: 'Leyenda de Neon DB', desc: 'Alcanza el Nivel 300 — leyenda viva de Neon Database.' },
  },
  nivel_500: {
    en: { nome: 'SQL Immortal', desc: 'Reach Level 500 — existence beyond mortal SQL.' },
    es: { nome: 'Inmortal del SQL', desc: 'Alcanza el Nivel 500 — existencia más allá del SQL mortal.' },
  },
  nivel_750: {
    en: { nome: 'Data Supreme', desc: 'Reach Level 750 — you transcended the concept of database.' },
    es: { nome: 'Supremo de Datos', desc: 'Alcanza el Nivel 750 — trascendiste el concepto de base de datos.' },
  },
  nivel_1000: {
    en: { nome: 'The Creator', desc: 'Reach Level 1000 — absolute milestone. You are SQLQuest.' },
    es: { nome: 'El Creador', desc: 'Alcanza el Nivel 1000 — hito absoluto. Tú eres SQLQuest.' },
  },
  prestige_1: {
    en: { nome: 'First Prestige', desc: 'Reset to Level 1 after reaching Level 100 and earn the Prestige Star.' },
    es: { nome: 'Primer Prestigio', desc: 'Reinicia al Nivel 1 después de alcanzar el Nivel 100 y gana la Estrella de Prestigio.' },
  },
  prestige_5: {
    en: { nome: 'Prestige Veteran', desc: 'Reach Prestige 5 — five complete journeys from Level 1 to 100.' },
    es: { nome: 'Veterano del Prestigio', desc: 'Alcanza el Prestigio 5 — cinco jornadas completas del Nivel 1 al 100.' },
  },
  trilha_elite: {
    en: { nome: 'Elite Pilot', desc: 'Complete the Elite Challenges: Tuning and Performance trail' },
    es: { nome: 'Piloto de Élite', desc: 'Completa la ruta Desafíos de Élite: Tuning y Rendimiento' },
  },
  escovador_bits: {
    en: { nome: 'Bit Scrubber', desc: 'Complete the Elite Challenges with 3 stars on all exercises' },
    es: { nome: 'Pulidor de Bits', desc: 'Completa los Desafíos de Élite con 3 estrellas en todos los ejercicios' },
  },
  platina_fundamentos: {
    en: { nome: 'Fundamentals Platinum', desc: 'Earn 3 stars on all exercises in the SQL Fundamentals trail.' },
    es: { nome: 'Platino Fundamentos', desc: 'Obtén 3 estrellas en todos los ejercicios de la ruta Fundamentos de SQL.' },
  },
  platina_select: {
    en: { nome: 'SELECT Platinum', desc: 'Earn 3 stars on all exercises in the SELECT — Reading Data trail.' },
    es: { nome: 'Platino SELECT', desc: 'Obtén 3 estrellas en todos los ejercicios de la ruta SELECT — Leyendo Datos.' },
  },
  platina_filtragem: {
    en: { nome: 'Filtering Platinum', desc: 'Earn 3 stars on all exercises in the WHERE and Filtering trail.' },
    es: { nome: 'Platino Filtrado', desc: 'Obtén 3 estrellas en todos los ejercicios de la ruta WHERE y Filtrado.' },
  },
  platina_joins: {
    en: { nome: 'JOINs Platinum', desc: 'Earn 3 stars on all exercises in the JOINs — Joining Tables trail.' },
    es: { nome: 'Platino JOINs', desc: 'Obtén 3 estrellas en todos los ejercicios de la ruta JOINs — Uniendo Tablas.' },
  },
  platina_groupby: {
    en: { nome: 'Grouping Platinum', desc: 'Earn 3 stars on all exercises in the GROUP BY and HAVING trail.' },
    es: { nome: 'Platino Agrupamiento', desc: 'Obtén 3 estrellas en todos los ejercicios de la ruta GROUP BY y HAVING.' },
  },
  platina_dml: {
    en: { nome: 'DML Platinum', desc: 'Earn 3 stars on all exercises in the INSERT, UPDATE and DELETE trail.' },
    es: { nome: 'Platino DML', desc: 'Obtén 3 estrellas en todos los ejercicios de la ruta INSERT, UPDATE y DELETE.' },
  },
}

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

  // Determina o locale a partir do cookie
  const cookieStore = await cookies()
  const locale = cookieStore.get(COOKIE_NAME)?.value ?? 'pt'

  // Aplica tradução a uma conquista
  function localizar<T extends { id: string; nome: string; desc: string }>(c: T): T {
    const tr = CONQUISTAS_I18N[c.id]?.[locale]
    return tr ? { ...c, ...tr } : c
  }

  const rankingLocalizadas = getRankingConquistasLocalizadas(locale)
  const conquistasRankingFormatadas = rankingLocalizadas.map(rc => {
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

  return NextResponse.json([...conquistas.map(localizar), ...conquistasRankingFormatadas])
}
