// ── Components ────────────────────────────────────────────────────────────────
export { ConquistaToast } from './components/ConquistaToast'
export { LevelUpModal } from './components/LevelUpModal'
export { LevelUpToast } from './components/LevelUpToast'
export { PrestigeBadge, getPrestigeTier } from './components/PrestigeBadge'
export { XpBar } from './components/XpBar'

// ── Domain: XP engine ─────────────────────────────────────────────────────────
export {
  XP_POR_ESTRELAS,
  XP_EVENTOS,
  MAX_LEVEL,
  calcularEstrelas,
  getLevel,
  getLevelBadge,
  getLevelLabel,
  getProgressoPct,
  getXpParaProximo,
  xpParaNivel,
} from './domain/xp'
export type { LevelBadge } from './domain/xp'

// ── Domain: Streak ────────────────────────────────────────────────────────────
export { computeNovoStreak } from './domain/streak'

// ── Domain: Prestígio ─────────────────────────────────────────────────────────
// prestige.ts e level-titles.ts são internos (usados apenas dentro desta feature)
export { aplicarPrestigioSeElegivel, aplicarPrestigioSeElegivelTx } from './domain/apply-prestige'
export type { AplicarPrestigioResult, ConquistaNotificacaoPrestigio } from './domain/apply-prestige'

// ── Domain: Conquistas ────────────────────────────────────────────────────────
export {
  TRILHA_CONQUISTA_SLUGS,
  TRILHA_CONQUISTAS,
  TRES_ESTRELAS_CONQUISTA,
  SECOES_CONQUISTA_ORDEM,
  EXERCISE_MILESTONES,
  STREAK_MILESTONES,
  CONQUISTAS_I18N,
  trilhaConquistaId,
  novasConquistasExercicios,
  novasConquistasNivel,
  novasConquistasStreak,
  listarDefinicoesConquistasGerais,
  temAlgumaTresEstrelas,
  totalExerciciosConcluidosGlobal,
  countExerciciosComXpNaTrilha,
  trilhaExerciciosConcluida,
  buildPrestigeConquistaDef,
  buildPrestigeConquistaNotificacao,
  localizarPrestigioConquista,
  parsePrestigioEstrelaN,
  prestigioEstrelaId,
} from './domain/conquistas-definitions'
export type {
  ConquistaDef,
  ConquistaToastMeta,
  ConquistaNotificacao,
  ProgressoConquistaInput,
  SecaoConquista,
  TrilhaConquistaSlug,
} from './domain/conquistas-definitions'
