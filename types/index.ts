export interface ConteudoIntro {
  emoji: string
  subtitulo: string
}

export interface ConteudoTexto {
  blocos: string[]
}

export interface ConteudoResumo {
  cor: 'verde' | 'roxo' | 'azul' | 'laranja'
  itens: string[]
}

export interface ConteudoExercicio {
  instrucao: string
  dica: string
  placeholder: string
  schema: string
  checkType: 'columns' | 'count' | 'values' | 'aggregate'
  checkConfig: {
    required_columns?: string[]
    min_rows?: number
    expected_rows?: number
    expected_values?: unknown[]
  }
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
