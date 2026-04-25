import type { Locale } from '@/lib/locale'

type RankCopy = { nome: string; emoji: string }

/** Patentes de exibição a cada 5 níveis no ciclo atual (1–100). Cores vêm de getLevelVisualStyle em xp.ts. */
const RANKS: Array<{ min: number; pt: RankCopy; en: RankCopy; es: RankCopy }> = [
  {
    min: 100,
    pt: { nome: 'Centelha Máxima', emoji: '👑' },
    en: { nome: 'Peak Spark', emoji: '👑' },
    es: { nome: 'Centella Máxima', emoji: '👑' },
  },
  {
    min: 95,
    pt: { nome: 'Um Sopro do Ápice', emoji: '🌬️' },
    en: { nome: 'Breath Before the Peak', emoji: '🌬️' },
    es: { nome: 'Soplo del Ápice', emoji: '🌬️' },
  },
  {
    min: 90,
    pt: { nome: 'Quase Lendário', emoji: '✨' },
    en: { nome: 'Almost Legendary', emoji: '✨' },
    es: { nome: 'Casi Legendario', emoji: '✨' },
  },
  {
    min: 85,
    pt: { nome: 'Elite da Query', emoji: '🎯' },
    en: { nome: 'Query Elite', emoji: '🎯' },
    es: { nome: 'Élite del Query', emoji: '🎯' },
  },
  {
    min: 80,
    pt: { nome: 'Veterano Absoluto', emoji: '🏛️' },
    en: { nome: 'Absolute Veteran', emoji: '🏛️' },
    es: { nome: 'Veterano Absoluto', emoji: '🏛️' },
  },
  {
    min: 75,
    pt: { nome: 'Caçador de Bugs', emoji: '🔥' },
    en: { nome: 'Bug Hunter Mode', emoji: '🔥' },
    es: { nome: 'Cazador de Bugs', emoji: '🔥' },
  },
  {
    min: 70,
    pt: { nome: 'Titã do Dataset', emoji: '📊' },
    en: { nome: 'Dataset Titan', emoji: '📊' },
    es: { nome: 'Titán del Dataset', emoji: '📊' },
  },
  {
    min: 65,
    pt: { nome: 'Oráculo em Ascensão', emoji: '🔮' },
    en: { nome: 'Rising Oracle', emoji: '🔮' },
    es: { nome: 'Oráculo en Ascenso', emoji: '🔮' },
  },
  {
    min: 60,
    pt: { nome: 'Engenheiro de Pipeline', emoji: '⚙️' },
    en: { nome: 'Pipeline Engineer', emoji: '⚙️' },
    es: { nome: 'Ingeniero de Pipeline', emoji: '⚙️' },
  },
  {
    min: 55,
    pt: { nome: 'Virtuose em Treino', emoji: '🎭' },
    en: { nome: 'Virtuoso in Training', emoji: '🎭' },
    es: { nome: 'Virtuoso en Entrenamiento', emoji: '🎭' },
  },
  {
    min: 50,
    pt: { nome: 'Mestre de Batalha', emoji: '⚔️' },
    en: { nome: 'Battle Master', emoji: '⚔️' },
    es: { nome: 'Maestro de Batalla', emoji: '⚔️' },
  },
  {
    min: 45,
    pt: { nome: 'Estrategista SQL', emoji: '🧠' },
    en: { nome: 'SQL Strategist', emoji: '🧠' },
    es: { nome: 'Estratega SQL', emoji: '🧠' },
  },
  {
    min: 40,
    pt: { nome: 'Otimizador Nativo', emoji: '🔧' },
    en: { nome: 'Native Optimizer', emoji: '🔧' },
    es: { nome: 'Optimizador Nativo', emoji: '🔧' },
  },
  {
    min: 35,
    pt: { nome: 'Arquiteto de JOIN', emoji: '🏗️' },
    en: { nome: 'JOIN Architect', emoji: '🏗️' },
    es: { nome: 'Arquitecto de JOIN', emoji: '🏗️' },
  },
  {
    min: 30,
    pt: { nome: 'Especialista Certificado', emoji: '💎' },
    en: { nome: 'Certified Specialist', emoji: '💎' },
    es: { nome: 'Especialista Certificado', emoji: '💎' },
  },
  {
    min: 25,
    pt: { nome: 'Filtro Cirúrgico', emoji: '🔬' },
    en: { nome: 'Surgical Filter', emoji: '🔬' },
    es: { nome: 'Filtro Quirúrgico', emoji: '🔬' },
  },
  {
    min: 20,
    pt: { nome: 'Analista Oficial', emoji: '📈' },
    en: { nome: 'Official Analyst', emoji: '📈' },
    es: { nome: 'Analista Oficial', emoji: '📈' },
  },
  {
    min: 15,
    pt: { nome: 'Leitor de Schema', emoji: '📑' },
    en: { nome: 'Schema Reader', emoji: '📑' },
    es: { nome: 'Lector de Esquema', emoji: '📑' },
  },
  {
    min: 10,
    pt: { nome: 'Explorador de Dados', emoji: '🗺️' },
    en: { nome: 'Data Explorer', emoji: '🗺️' },
    es: { nome: 'Explorador de Datos', emoji: '🗺️' },
  },
  {
    min: 5,
    pt: { nome: 'Iniciante Destemido', emoji: '🌱' },
    en: { nome: 'Bold Beginner', emoji: '🌱' },
    es: { nome: 'Principiante Audaz', emoji: '🌱' },
  },
  {
    min: 1,
    pt: { nome: 'Aprendiz de Query', emoji: '📚' },
    en: { nome: 'Query Apprentice', emoji: '📚' },
    es: { nome: 'Aprendiz de Query', emoji: '📚' },
  },
]

export function getLevelRankTitle(level: number, locale: Locale = 'pt'): RankCopy {
  const lv = Math.max(1, level)
  const loc = locale === 'en' || locale === 'es' ? locale : 'pt'
  for (const row of RANKS) {
    if (lv >= row.min) return row[loc]
  }
  return RANKS[RANKS.length - 1][loc]
}
