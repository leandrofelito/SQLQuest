/** Metadados de toast / carta (sem descrição longa) */
export interface ConquistaToastMeta {
  emoji: string
  nome: string
}

/** Definição completa de uma conquista geral (PT base) */
export interface ConquistaDef extends ConquistaToastMeta {
  id: string
  desc: string
  categoria?: string
}

export const TRILHA_CONQUISTA_SLUGS = ['fundamentos', 'manipulacao-dados'] as const
export type TrilhaConquistaSlug = (typeof TRILHA_CONQUISTA_SLUGS)[number]

/** Slug → toast ao concluir todos os exercícios (com XP) da trilha */
export const TRILHA_CONQUISTAS: Record<TrilhaConquistaSlug, ConquistaToastMeta> = {
  fundamentos: { emoji: '🗄️', nome: 'Alicerce Relacional' },
  'manipulacao-dados': { emoji: '📊', nome: 'Arquiteto da Leitura' },
}

export function trilhaConquistaId(slug: string): string {
  return `trilha_${slug.replace(/-/g, '_')}`
}

export interface ProgressoConquistaInput {
  xpGanho: number
  trilha: { slug: string }
  etapa: { tipo: string }
  estrelas: number
}

export function countExerciciosComXpNaTrilha(slug: string, progressos: ProgressoConquistaInput[]): number {
  return progressos.filter(
    p => p.trilha.slug === slug && p.etapa.tipo === 'exercicio' && p.xpGanho > 0
  ).length
}

export function trilhaExerciciosConcluida(
  slug: string,
  progressos: ProgressoConquistaInput[],
  exerciciosPorTrilha: Record<string, number>
): boolean {
  const total = exerciciosPorTrilha[slug] ?? 0
  if (total <= 0) return false
  return countExerciciosComXpNaTrilha(slug, progressos) >= total
}

export function totalExerciciosConcluidosGlobal(progressos: ProgressoConquistaInput[]): number {
  return progressos.filter(p => p.etapa.tipo === 'exercicio' && p.xpGanho > 0).length
}

export const STREAK_MILESTONES: { id: string; days: number; emoji: string; nome: string; desc: string }[] = [
  { id: 'streak_7', days: 7, emoji: '🔥', nome: 'Semana de Fogo', desc: 'Mantenha um streak de 7 dias seguidos estudando (uma semana).' },
  { id: 'streak_14', days: 14, emoji: '💥', nome: 'Duas Semanas Firmes', desc: 'Mantenha um streak de 14 dias consecutivos.' },
  { id: 'streak_30', days: 30, emoji: '🌙', nome: 'Mês na Rotina', desc: 'Mantenha um streak de 30 dias consecutivos.' },
  { id: 'streak_60', days: 60, emoji: '🌊', nome: 'Dois Meses Sólidos', desc: 'Mantenha um streak de 60 dias consecutivos.' },
  { id: 'streak_90', days: 90, emoji: '⚡', nome: 'Trimestre de Disciplina', desc: 'Mantenha um streak de 90 dias consecutivos.' },
  { id: 'streak_180', days: 180, emoji: '🏔️', nome: 'Meio Ano de Foco', desc: 'Mantenha um streak de 180 dias consecutivos.' },
  { id: 'streak_365', days: 365, emoji: '🎯', nome: 'Ano Ininterrupto', desc: 'Mantenha um streak de 365 dias consecutivos (1 ano).' },
  { id: 'streak_730', days: 730, emoji: '🏆', nome: 'Biênio Lendário', desc: 'Mantenha um streak de 730 dias consecutivos (2 anos).' },
  { id: 'streak_1825', days: 1825, emoji: '👑', nome: 'Quinquênio Supremo', desc: 'Mantenha um streak de 1825 dias consecutivos (5 anos).' },
  { id: 'streak_3650', days: 3650, emoji: '✨', nome: 'Década Imortal', desc: 'Mantenha um streak de 3650 dias consecutivos (10 anos).' },
]

/** Primeira vez com 3 estrelas em qualquer exercício (conta) */
export const TRES_ESTRELAS_CONQUISTA = {
  id: 'primeira_constelacao',
  emoji: '✨',
  nome: 'Primeira Constelação',
  desc: 'Acerte um exercício com 3 estrelas: primeira tentativa, sem dica — o jeito SQLQuest de ser nota máxima.',
} as const

export const LEVEL_MILESTONES: { id: string; nivel: number; emoji: string; nome: string; desc: string }[] = [
  { id: 'nivel_5', nivel: 5, emoji: '🌱', nome: 'Painel de Controle', desc: 'Atinga o nível 5 — você já entendeu o jogo.' },
  { id: 'nivel_10', nivel: 10, emoji: '🚀', nome: 'Subiu de Tier', desc: 'Atinga o nível 10 — suas queries já têm personalidade.' },
  { id: 'nivel_15', nivel: 15, emoji: '⚡', nome: 'Sintaxe Turbo', desc: 'Atinga o nível 15 — o teclado é extensão do cérebro.' },
  { id: 'nivel_20', nivel: 20, emoji: '📡', nome: 'Sinal SQL em Alta', desc: 'Atinga o nível 20 — os dados te ouvem.' },
  { id: 'nivel_30', nivel: 30, emoji: '🧭', nome: 'GPS dos Dados', desc: 'Atinga o nível 30 — você não se perde em tabela nenhuma.' },
  { id: 'nivel_40', nivel: 40, emoji: '🔧', nome: 'Engenheiro de Resultado', desc: 'Atinga o nível 40 — resultado é documentação.' },
  { id: 'nivel_50', nivel: 50, emoji: '🎖️', nome: 'Meio-Campo Lendário', desc: 'Atinga o nível 50 — metade do infinito, todo o estilo.' },
  { id: 'nivel_75', nivel: 75, emoji: '⚔️', nome: 'Modo Raid', desc: 'Atinga o nível 75 — só entra quem veio para resolver.' },
  { id: 'nivel_100', nivel: 100, emoji: '🌟', nome: 'Centelha Máxima', desc: 'Atinga o nível 100 — brilho máximo antes do prestígio.' },
]

export const EXERCISE_MILESTONES: { id: string; count: number; emoji: string; nome: string; desc: string }[] = [
  { id: 'exercicios_10', count: 10, emoji: '⚡', nome: '10 Queries Válidas', desc: 'Conclua 10 exercícios com XP (respostas validadas no servidor).' },
  { id: 'exercicios_25', count: 25, emoji: '🌱', nome: '25 Desafios', desc: 'Conclua 25 exercícios com XP.' },
  { id: 'exercicios_50', count: 50, emoji: '📚', nome: '50 Exercícios', desc: 'Conclua 50 exercícios com XP.' },
  { id: 'exercicios_100', count: 100, emoji: '💎', nome: 'Centena de Exercícios', desc: 'Conclua 100 exercícios com XP.' },
  { id: 'exercicios_250', count: 250, emoji: '🔮', nome: '250 Resolvidos', desc: 'Conclua 250 exercícios com XP.' },
  { id: 'exercicios_500', count: 500, emoji: '🛡️', nome: '500 Completados', desc: 'Conclua 500 exercícios com XP.' },
  { id: 'exercicios_1000', count: 1000, emoji: '🏅', nome: 'Mil Exercícios', desc: 'Conclua 1000 exercícios com XP.' },
  { id: 'exercicios_2500', count: 2500, emoji: '🚀', nome: '2500 Queries', desc: 'Conclua 2500 exercícios com XP.' },
  { id: 'exercicios_5000', count: 5000, emoji: '🌌', nome: '5000 Conquistas', desc: 'Conclua 5000 exercícios com XP.' },
  { id: 'exercicios_10000', count: 10000, emoji: '👑', nome: 'Lenda dos Exercícios', desc: 'Conclua 10000 exercícios com XP.' },
]

function trilhaDefs(): ConquistaDef[] {
  return [
    {
      id: trilhaConquistaId('fundamentos'),
      emoji: TRILHA_CONQUISTAS.fundamentos.emoji,
      nome: TRILHA_CONQUISTAS.fundamentos.nome,
      desc: 'Conclua todos os exercícios da trilha Fundamentos do SQL (com validação e XP).',
      categoria: 'trilha',
    },
    {
      id: trilhaConquistaId('manipulacao-dados'),
      emoji: TRILHA_CONQUISTAS['manipulacao-dados'].emoji,
      nome: TRILHA_CONQUISTAS['manipulacao-dados'].nome,
      desc: 'Conclua todos os exercícios da trilha Manipulação de Dados (com validação e XP).',
      categoria: 'trilha',
    },
  ]
}

function streakDefs(): ConquistaDef[] {
  return STREAK_MILESTONES.map(m => ({
    id: m.id,
    emoji: m.emoji,
    nome: m.nome,
    desc: m.desc,
    categoria: 'streak',
  }))
}

function exerciseDefs(): ConquistaDef[] {
  return EXERCISE_MILESTONES.map(m => ({
    id: m.id,
    emoji: m.emoji,
    nome: m.nome,
    desc: m.desc,
    categoria: 'exercicios',
  }))
}

function tresEstrelasDef(): ConquistaDef {
  return {
    id: TRES_ESTRELAS_CONQUISTA.id,
    emoji: TRES_ESTRELAS_CONQUISTA.emoji,
    nome: TRES_ESTRELAS_CONQUISTA.nome,
    desc: TRES_ESTRELAS_CONQUISTA.desc,
    categoria: 'habilidade',
  }
}

function nivelDefs(): ConquistaDef[] {
  return LEVEL_MILESTONES.map(m => ({
    id: m.id,
    emoji: m.emoji,
    nome: m.nome,
    desc: m.desc,
    categoria: 'nivel',
  }))
}

/** Lista estática em PT (desbloqueio calculado na API) */
export function listarDefinicoesConquistasGerais(): ConquistaDef[] {
  return [...trilhaDefs(), tresEstrelasDef(), ...nivelDefs(), ...streakDefs(), ...exerciseDefs()]
}

/** i18n EN/ES: chave = id da conquista */
export const CONQUISTAS_I18N: Record<string, Record<string, { nome: string; desc: string }>> = {
  trilha_fundamentos: {
    en: { nome: 'Relational Foundation', desc: 'Complete all exercises in the SQL Fundamentals trail (server-validated, with XP).' },
    es: { nome: 'Cimiento Relacional', desc: 'Completa todos los ejercicios de la ruta Fundamentos de SQL (validados con XP).' },
  },
  trilha_manipulacao_dados: {
    en: { nome: 'Reading Architect', desc: 'Complete all exercises in the Data Manipulation trail (with XP).' },
    es: { nome: 'Arquitecto de la Lectura', desc: 'Completa todos los ejercicios de la ruta Manipulación de Datos (con XP).' },
  },
  primeira_constelacao: {
    en: { nome: 'First Constellation', desc: 'Earn 3 stars on an exercise: first try, no hints — SQLQuest\'s version of a perfect score.' },
    es: { nome: 'Primera Constelación', desc: 'Consigue 3 estrellas en un ejercicio: primer intento, sin pistas — la nota máxima SQLQuest.' },
  },
  nivel_5: {
    en: { nome: 'Control Panel', desc: 'Reach Level 5 — you\'ve figured out the game.' },
    es: { nome: 'Panel de Control', desc: 'Alcanza el nivel 5 — ya entendiste el juego.' },
  },
  nivel_10: {
    en: { nome: 'Tier Up', desc: 'Reach Level 10 — your queries have personality.' },
    es: { nome: 'Subiste de Tier', desc: 'Alcanza el nivel 10 — tus consultas ya tienen personalidad.' },
  },
  nivel_15: {
    en: { nome: 'Syntax Turbo', desc: 'Reach Level 15 — the keyboard is an extension of your brain.' },
    es: { nome: 'Sintaxis Turbo', desc: 'Alcanza el nivel 15 — el teclado es extensión del cerebro.' },
  },
  nivel_20: {
    en: { nome: 'Strong SQL Signal', desc: 'Reach Level 20 — the data hears you.' },
    es: { nome: 'Señal SQL en Alta', desc: 'Alcanza el nivel 20 — los datos te escuchan.' },
  },
  nivel_30: {
    en: { nome: 'Data GPS', desc: 'Reach Level 30 — you won\'t get lost in any table.' },
    es: { nome: 'GPS de Datos', desc: 'Alcanza el nivel 30 — no te pierdes en ninguna tabla.' },
  },
  nivel_40: {
    en: { nome: 'Result Engineer', desc: 'Reach Level 40 — results are documentation.' },
    es: { nome: 'Ingeniero de Resultado', desc: 'Alcanza el nivel 40 — el resultado es documentación.' },
  },
  nivel_50: {
    en: { nome: 'Legendary Midfield', desc: 'Reach Level 50 — half of infinity, all the style.' },
    es: { nome: 'Mediocampo Legendario', desc: 'Alcanza el nivel 50 — mitad del infinito, todo el estilo.' },
  },
  nivel_75: {
    en: { nome: 'Raid Mode', desc: 'Reach Level 75 — only those who came to solve get in.' },
    es: { nome: 'Modo Raid', desc: 'Alcanza el nivel 75 — solo entra quien vino a resolver.' },
  },
  nivel_100: {
    en: { nome: 'Peak Spark', desc: 'Reach Level 100 — maximum shine before prestige.' },
    es: { nome: 'Centella Máxima', desc: 'Alcanza el nivel 100 — brillo máximo antes del prestigio.' },
  },
  streak_7: {
    en: { nome: 'Week on Fire', desc: 'Keep a 7-day study streak (one full week).' },
    es: { nome: 'Semana en Llamas', desc: 'Mantén una racha de 7 días seguidos estudiando (una semana).' },
  },
  streak_14: {
    en: { nome: 'Two Strong Weeks', desc: 'Keep a 14-day consecutive streak.' },
    es: { nome: 'Dos Semanas Firmes', desc: 'Mantén una racha de 14 días consecutivos.' },
  },
  streak_30: {
    en: { nome: 'Month in the Groove', desc: 'Keep a 30-day consecutive streak.' },
    es: { nome: 'Mes en la Rutina', desc: 'Mantén una racha de 30 días consecutivos.' },
  },
  streak_60: {
    en: { nome: 'Two Solid Months', desc: 'Keep a 60-day consecutive streak.' },
    es: { nome: 'Dos Meses Sólidos', desc: 'Mantén una racha de 60 días consecutivos.' },
  },
  streak_90: {
    en: { nome: 'Quarter of Discipline', desc: 'Keep a 90-day consecutive streak.' },
    es: { nome: 'Trimestre de Disciplina', desc: 'Mantén una racha de 90 días consecutivos.' },
  },
  streak_180: {
    en: { nome: 'Half-Year Focus', desc: 'Keep a 180-day consecutive streak.' },
    es: { nome: 'Medio Año de Foco', desc: 'Mantén una racha de 180 días consecutivos.' },
  },
  streak_365: {
    en: { nome: 'Unbroken Year', desc: 'Keep a 365-day consecutive streak (1 year).' },
    es: { nome: 'Año Ininterrumpido', desc: 'Mantén una racha de 365 días consecutivos (1 año).' },
  },
  streak_730: {
    en: { nome: 'Legendary Biennium', desc: 'Keep a 730-day consecutive streak (2 years).' },
    es: { nome: 'Bienio Legendario', desc: 'Mantén una racha de 730 días consecutivos (2 años).' },
  },
  streak_1825: {
    en: { nome: 'Supreme Quinquennium', desc: 'Keep a 1825-day consecutive streak (5 years).' },
    es: { nome: 'Quinquenio Supremo', desc: 'Mantén una racha de 1825 días consecutivos (5 años).' },
  },
  streak_3650: {
    en: { nome: 'Immortal Decade', desc: 'Keep a 3650-day consecutive streak (10 years).' },
    es: { nome: 'Década Inmortal', desc: 'Mantén una racha de 3650 días consecutivos (10 años).' },
  },
  exercicios_10: {
    en: { nome: '10 Valid Queries', desc: 'Complete 10 exercises with XP (server-validated).' },
    es: { nome: '10 Consultas Válidas', desc: 'Completa 10 ejercicios con XP (validados en el servidor).' },
  },
  exercicios_25: {
    en: { nome: '25 Challenges', desc: 'Complete 25 exercises with XP.' },
    es: { nome: '25 Desafíos', desc: 'Completa 25 ejercicios con XP.' },
  },
  exercicios_50: {
    en: { nome: '50 Exercises', desc: 'Complete 50 exercises with XP.' },
    es: { nome: '50 Ejercicios', desc: 'Completa 50 ejercicios con XP.' },
  },
  exercicios_100: {
    en: { nome: 'Hundred Exercises', desc: 'Complete 100 exercises with XP.' },
    es: { nome: 'Centena de Ejercicios', desc: 'Completa 100 ejercicios con XP.' },
  },
  exercicios_250: {
    en: { nome: '250 Solved', desc: 'Complete 250 exercises with XP.' },
    es: { nome: '250 Resueltos', desc: 'Completa 250 ejercicios con XP.' },
  },
  exercicios_500: {
    en: { nome: '500 Completed', desc: 'Complete 500 exercises with XP.' },
    es: { nome: '500 Completados', desc: 'Completa 500 ejercicios con XP.' },
  },
  exercicios_1000: {
    en: { nome: 'Thousand Exercises', desc: 'Complete 1000 exercises with XP.' },
    es: { nome: 'Mil Ejercicios', desc: 'Completa 1000 ejercicios con XP.' },
  },
  exercicios_2500: {
    en: { nome: '2500 Queries', desc: 'Complete 2500 exercises with XP.' },
    es: { nome: '2500 Consultas', desc: 'Completa 2500 ejercicios con XP.' },
  },
  exercicios_5000: {
    en: { nome: '5000 Milestone', desc: 'Complete 5000 exercises with XP.' },
    es: { nome: '5000 Conquistas', desc: 'Completa 5000 ejercicios con XP.' },
  },
  exercicios_10000: {
    en: { nome: 'Exercise Legend', desc: 'Complete 10000 exercises with XP.' },
    es: { nome: 'Leyenda de Ejercicios', desc: 'Completa 10000 ejercicios con XP.' },
  },
}

export interface ConquistaNotificacao {
  id: string
  emoji: string
  nome: string
}

export function novasConquistasStreak(streakAnterior: number, streakNovo: number): ConquistaNotificacao[] {
  const out: ConquistaNotificacao[] = []
  for (const m of STREAK_MILESTONES) {
    if (streakAnterior < m.days && streakNovo >= m.days) {
      out.push({ id: m.id, emoji: m.emoji, nome: m.nome })
    }
  }
  return out
}

export function novasConquistasExercicios(anteriorTotal: number, novoTotal: number): ConquistaNotificacao[] {
  const out: ConquistaNotificacao[] = []
  for (const m of EXERCISE_MILESTONES) {
    if (anteriorTotal < m.count && novoTotal >= m.count) {
      out.push({ id: m.id, emoji: m.emoji, nome: m.nome })
    }
  }
  return out
}

export function novasConquistasNivel(nivelAnterior: number, nivelAtual: number): ConquistaNotificacao[] {
  const out: ConquistaNotificacao[] = []
  for (const m of LEVEL_MILESTONES) {
    if (nivelAnterior < m.nivel && nivelAtual >= m.nivel) {
      out.push({ id: m.id, emoji: m.emoji, nome: m.nome })
    }
  }
  return out
}

/** Pelo menos um exercício com 3 estrelas e XP (nota máxima) */
export function temAlgumaTresEstrelas(progressos: ProgressoConquistaInput[]): boolean {
  return progressos.some(
    p => p.etapa.tipo === 'exercicio' && p.xpGanho > 0 && p.estrelas === 3
  )
}
