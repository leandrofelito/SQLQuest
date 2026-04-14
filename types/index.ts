// Rich content block for TelaTexto
export type BlocoTexto =
  | string
  | { type: 'code'; code: string; lese?: string }
  | { type: 'nota'; texto: string }
  | { type: 'definicao'; termo: string; def: string }
  | { type: 'tabela'; cabecalhos: string[]; linhas: string[][] }

export interface ConteudoIntro {
  emoji: string
  subtitulo: string
}

export interface ConteudoTexto {
  blocos: BlocoTexto[]
}

export interface ConteudoResumo {
  cor: 'verde' | 'roxo' | 'azul' | 'laranja'
  itens: string[]
}

export type ExercicioCheckType = 'columns' | 'count' | 'values' | 'aggregate'

export interface ExercicioCheckConfig {
  required_columns?: string[]
  min_rows?: number
  expected_rows?: number
  expected_values?: unknown[]
}

/** Exercício com sandbox SQL (padrão quando `modo` é omitido) */
export interface ConteudoExercicioSql {
  modo?: 'sql'
  instrucao: string
  /** Uma única dica (legado); use `dicas` para progressão com anúncio. */
  dica?: string
  /** Lista de dicas reveladas em sequência (gratuito: uma por anúncio). */
  dicas?: string[]
  placeholder: string
  schema: string
  checkType: ExercicioCheckType
  checkConfig: ExercicioCheckConfig
  /** Aviso exibido quando a query está correta mas usa padrões lentos (ex: SELECT *) */
  performanceAviso?: string
  /** Explicação técnica exibida após resposta correta, referenciando o plano de execução */
  explicacaoTecnica?: string
  /** Inserido no editor após "Ver dica" (com anúncio), antes do texto que o usuário já digitou */
  dicaPreenchimento?: string
}

export type ConteudoExercicioQuiz =
  | {
      modo: 'quiz'
      quizTipo: 'multipla'
      instrucao: string
      dica?: string
      dicas?: string[]
      opcoes: string[]
      indiceCorreto: number
    }
  | {
      modo: 'quiz'
      quizTipo: 'vf'
      afirmacao: string
      instrucao?: string
      dica?: string
      dicas?: string[]
      respostaCorreta: boolean
    }
  | {
      modo: 'quiz'
      quizTipo: 'reflexao'
      instrucao: string
      cenario?: string
      dica?: string
      dicas?: string[]
      /** Trecho sugerido inserido no textarea após revelar a dica */
      dicaPreenchimento?: string
      placeholder?: string
      minLength: number
    }

export type ConteudoExercicio = ConteudoExercicioSql | ConteudoExercicioQuiz

export function isSqlExercicio(c: ConteudoExercicio): c is ConteudoExercicioSql {
  return (c as { modo?: string }).modo !== 'quiz'
}

export function isQuizExercicio(c: ConteudoExercicio): c is ConteudoExercicioQuiz {
  return (c as { modo?: string }).modo === 'quiz'
}

export interface ConteudoConclusao {
  mensagem: string
  xpGanho: number
}

export type ConteudoEtapa =
  | ConteudoIntro
  | ConteudoTexto
  | ConteudoResumo
  | ConteudoExercicio
  | ConteudoConclusao

export interface EtapaJSON {
  ordem: number
  tipo: 'intro' | 'texto' | 'resumo' | 'exercicio' | 'conclusao'
  titulo: string
  temAnuncio: boolean
  xpReward: number
  conteudo: ConteudoEtapa
}

export interface TrilhaJSON {
  slug: string
  titulo: string
  descricao: string
  icone: string
  ordem: number
  xpTotal: number
  etapas: EtapaJSON[]
}

export interface UserSession {
  id: string
  email: string
  name: string
  image?: string
  isPro: boolean
  isAdmin: boolean
  totalXp: number
  streak: number
}

export interface TrilhaComProgresso {
  id: string
  slug: string
  titulo: string
  descricao: string
  icone: string
  ordem: number
  totalEtapas: number
  xpTotal: number
  publicada: boolean
  etapasCompletas: number
  percentual: number
  concluida: boolean
}

export interface EtapaDB {
  id: string
  trilhaId: string
  ordem: number
  tipo: string
  titulo: string
  conteudo: ConteudoEtapa
  xpReward: number
  temAnuncio: boolean
}

export interface QueryResult {
  columns: string[]
  values: unknown[][]
}

export interface CertificadoDB {
  id: string
  userId: string
  trilhaId: string
  hash: string
  emitidoEm: Date
  trilha: {
    titulo: string
    slug: string
    icone: string
  }
}
