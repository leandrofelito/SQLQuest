// ── Server Actions (importar diretamente nesta feature quando chamando do servidor)
// Nota: mantidos aqui para que páginas e layouts importem pelo alias da feature
export { salvarProgressoAction } from './actions/progress.actions'
export type {
  SalvarProgressoInput,
  SalvarProgressoResult,
  ConquistaMeta,
} from './actions/progress.actions'

export { marcarVisitadaAction } from './actions/stage.actions'
export type { MarcarVisitadaInput, MarcarVisitadaResult } from './actions/stage.actions'

// ── Components: telas de etapa ────────────────────────────────────────────────
export { TelaConclusao } from './components/screens/TelaConclusao'
export { TelaExercicio } from './components/screens/TelaExercicio'
export { TelaIntro } from './components/screens/TelaIntro'
export { TelaResumo } from './components/screens/TelaResumo'
export { TelaTexto } from './components/screens/TelaTexto'

// ── Components: exercício ─────────────────────────────────────────────────────
export { BotaoDica } from './components/exercise/BotaoDica'
export { PainelDicas } from './components/exercise/PainelDicas'

// ── Domain ─────────────────────────────────────────────────────────────────────
// calculate-progress: exposto para testes e scripts externos
export { calculateProgress } from './domain/calculate-progress'
export type { ProgressResult } from './domain/calculate-progress'
// hints e hints-exercise: internos, consumidos apenas pelos componentes desta feature
