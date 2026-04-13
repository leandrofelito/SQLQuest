'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useSQL } from '@/hooks/useSQL'
import { checkAnswer } from '@/lib/check-answer'
import { getDica, classificarErro } from '@/lib/dicas'
import { calcularEstrelas, XP_POR_ESTRELAS } from '@/lib/xp'
import { AnuncioVideo } from '@/components/anuncio/AnuncioVideo'
import { AdBanner } from '@/components/layout/AdBanner'
import { DesafioSeguro, EnunciadoSeguro } from '@/components/seguranca/DesafioSeguro'
import { useLocale } from '@/context/LocaleContext'
import type {
  ConteudoExercicio,
  ConteudoExercicioQuiz,
  ConteudoExercicioSql,
  QueryResult,
} from '@/types'
import { isQuizExercicio } from '@/types'

interface TelaExercicioProps {
  titulo: string
  etapaId: string
  conteudo: ConteudoExercicio
  xpReward: number
  isPro: boolean
  onConcluido: (estrelas: number, dicasUsadas: number, tentativas: number, token: string) => void
}

type Estado = 'idle' | 'verificando' | 'erro' | 'acerto' | 'performance_aviso'

/** Detecta padrões de query lentos: SELECT * ou SELECT alias.* */
function detectaQueryLenta(query: string): boolean {
  return /SELECT\s+\*/i.test(query)
}

function StarIcon({ filled, size = 40 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#facc15' : 'none'}
      stroke={filled ? '#facc15' : 'rgba(255,255,255,0.15)'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={filled ? { filter: 'drop-shadow(0 0 8px #facc15)' } : undefined}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// Labels are rendered inside ModalEstrelas via messages

function ModalEstrelas({
  estrelas,
  xp,
  explicacaoTecnica,
  isPro,
  onContinuar,
}: {
  estrelas: number
  xp: number
  explicacaoTecnica?: string
  isPro: boolean
  onContinuar: () => void
}) {
  const [showExplicacao, setShowExplicacao] = useState(false)
  const { messages } = useLocale()
  const LABELS_ESTRELAS: Record<number, string> = {
    3: messages.exercicio.elite,
    2: messages.exercicio.bomTrabalho,
    1: messages.exercicio.continuePraticando,
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-[#12141c] border border-[#2a2d3a] rounded-3xl pt-8 px-8 pb-4 text-center shadow-2xl overflow-y-auto max-h-[90vh]"
        initial={{ y: 80, scale: 0.92 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 80, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Título */}
        <motion.p
          className="text-white font-bold text-xl mb-1"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {LABELS_ESTRELAS[estrelas]}
        </motion.p>

        {/* XP */}
        <motion.div
          className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 rounded-full px-4 py-1.5 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 250 }}
        >
          <span className="text-amber-400 font-bold text-sm">+{xp} XP</span>
        </motion.div>

        {/* Estrelas + Legendas (elemento hero, centralizado) */}
        <div className="flex justify-center gap-6 mb-6">
          {([
            { label: messages.exercicio.acertou },
            { label: messages.exercicio.semDica },
            { label: messages.exercicio.primeiraTentativa },
          ]).map(({ label }, idx) => {
            const i = idx + 1
            const filled = i <= estrelas
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.35 + 0.15 * i,
                    type: 'spring',
                    stiffness: 260,
                    damping: 18,
                  }}
                >
                  <StarIcon filled={filled} size={44} />
                </motion.div>
                <motion.span
                  className={`text-[10px] font-semibold ${filled ? 'text-amber-400' : 'text-white/20'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                >
                  {label}
                </motion.span>
              </div>
            )
          })}
        </div>

        {/* Explicação técnica (desafios de elite) */}
        {explicacaoTecnica && (
          <motion.div
            className="mb-5 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <button
              onClick={() => setShowExplicacao(v => !v)}
              className="w-full flex items-center justify-between gap-2 bg-[#0f1520] border border-[#8b5cf6]/30 rounded-xl px-4 py-2.5 text-sm text-[#a78bfa] font-semibold hover:border-[#8b5cf6]/60 transition-colors"
            >
              <span>{messages.exercicio.planoExecucao}</span>
              <span className="text-[#8b5cf6]/60 text-xs">{showExplicacao ? '▲' : '▼'}</span>
            </button>
            <AnimatePresence>
              {showExplicacao && (
                <motion.div
                  className="mt-2 bg-[#0a0c12] border border-[#2a2d3a] rounded-xl p-4 text-xs text-white/70 leading-relaxed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-[#8b5cf6] font-bold text-xs mb-2 uppercase tracking-wider">PostgreSQL Execution Plan</p>
                  {explicacaoTecnica}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Botão Continuar */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
        >
          <Button onClick={onContinuar} fullWidth size="lg">
            {messages.exercicio.continuar}
          </Button>
        </motion.div>

        {/* Anúncio discreto no rodapé — apenas para usuários gratuitos */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <AdBanner />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

function ExercicioQuiz({
  titulo,
  etapaId,
  conteudo,
  isPro,
  onConcluido,
}: {
  titulo: string
  etapaId: string
  conteudo: ConteudoExercicioQuiz
  isPro: boolean
  onConcluido: (estrelas: number, dicasUsadas: number, tentativas: number, token: string) => void
}) {
  const { messages } = useLocale()
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensagemErro, setMensagemErro] = useState('')
  const [dicaAtual, setDicaAtual] = useState('')
  const [tentativas, setTentativas] = useState(0)
  const [dicasUsadas, setDicasUsadas] = useState(0)
  const [showAnuncioDica, setShowAnuncioDica] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [validandoServidor, setValidandoServidor] = useState(false)
  const [indiceSelecionado, setIndiceSelecionado] = useState<number | null>(null)
  const [vfSelecionado, setVfSelecionado] = useState<boolean | null>(null)
  const [textoReflexao, setTextoReflexao] = useState('')
  const dicaPendenteRef = useRef('')
  const estrelasFinalRef = useRef(0)
  const tokenRef = useRef('')
  const ultimoPayloadRef = useRef<Record<string, unknown>>({})

  const instrucaoTopo =
    conteudo.quizTipo === 'vf' && conteudo.instrucao
      ? conteudo.instrucao
      : conteudo.quizTipo !== 'vf'
        ? conteudo.instrucao
        : ''

  function resolverDicaQuiz() {
    const tipo = mensagemErro ? classificarErro(mensagemErro) : 'generico'
    return tentativas >= 2 ? conteudo.dica : getDica(tipo)
  }

  function pedirDica() {
    setDicasUsadas(prev => prev + 1)
    const dica = resolverDicaQuiz()
    if (!isPro) {
      dicaPendenteRef.current = dica
      setShowAnuncioDica(true)
    } else {
      setDicaAtual(dica)
    }
  }

  function liberarDica() {
    setShowAnuncioDica(false)
    setDicaAtual(dicaPendenteRef.current)
  }

  async function verificar() {
    setDicaAtual('')

    let payload: Record<string, unknown> = {}

    if (conteudo.quizTipo === 'multipla') {
      if (indiceSelecionado === null) {
        setEstado('erro')
        setMensagemErro(messages.exercicio.escolhaOpcao)
        setDicaAtual(getDica('generico'))
        return
      }
      payload = { indiceEscolhido: indiceSelecionado }
    } else if (conteudo.quizTipo === 'vf') {
      if (vfSelecionado === null) {
        setEstado('erro')
        setMensagemErro(messages.exercicio.escolhaOpcao)
        setDicaAtual(getDica('generico'))
        return
      }
      payload = { valorVF: vfSelecionado }
    } else {
      const t = textoReflexao.trim()
      if (t.length < conteudo.minLength) {
        setEstado('erro')
        setMensagemErro(messages.exercicio.reflexaoCurta)
        setDicaAtual(conteudo.dica)
        return
      }
      payload = { textoReflexao: t }
    }

    const novaTentativa = tentativas + 1
    setTentativas(novaTentativa)
    setEstado('verificando')
    ultimoPayloadRef.current = payload

    setValidandoServidor(true)
    try {
      const res = await fetch('/api/validar-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapaId,
          tentativas: novaTentativa,
          dicasUsadas,
          ...payload,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.sucesso && data.token) {
          tokenRef.current = data.token
          const estrelas = calcularEstrelas(novaTentativa, dicasUsadas)
          estrelasFinalRef.current = estrelas
          setEstado('acerto')
          setShowModal(true)
          return
        }
      }
      setEstado('erro')
      setMensagemErro(messages.exercicio.quizIncorreto)
      setDicaAtual(getDica('generico'))
    } catch {
      setEstado('erro')
      setMensagemErro(messages.exercicio.quizIncorreto)
      setDicaAtual(getDica('generico'))
    } finally {
      setValidandoServidor(false)
    }
  }

  async function continuar() {
    let token = tokenRef.current
    if (!token) {
      try {
        const res = await fetch('/api/validar-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            etapaId,
            tentativas,
            dicasUsadas,
            ...ultimoPayloadRef.current,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.sucesso && data.token) {
            token = data.token
            tokenRef.current = token
          }
        }
      } catch {
        /* empty */
      }
    }
    onConcluido(estrelasFinalRef.current, dicasUsadas, tentativas, token)
  }

  const xpModal = XP_POR_ESTRELAS[estrelasFinalRef.current] ?? 0
  const letras = 'ABCD'

  return (
    <DesafioSeguro>
      <div className="flex flex-col h-full px-4 py-6 gap-4">
        <div>
          <div className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-widest mb-1">{titulo}</div>
          {instrucaoTopo ? (
            <EnunciadoSeguro texto={instrucaoTopo} className="text-white/80 text-base leading-snug mb-3" />
          ) : null}
          {conteudo.quizTipo === 'vf' && (
            <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-4">
              <p className="text-white text-base font-medium leading-relaxed">{conteudo.afirmacao}</p>
            </div>
          )}
          {conteudo.quizTipo === 'reflexao' && conteudo.cenario && (
            <div className="mt-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
              <p className="text-amber-100/90 text-sm leading-relaxed">{conteudo.cenario}</p>
            </div>
          )}
        </div>

        {conteudo.quizTipo === 'multipla' && (
          <div className="space-y-2">
            {conteudo.opcoes.map((op, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIndiceSelecionado(i)
                  setEstado('idle')
                }}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm leading-relaxed transition-colors ${
                  indiceSelecionado === i
                    ? 'border-[#8b5cf6] bg-[#8b5cf6]/15 text-white'
                    : 'border-[#2a2d3a] bg-[#0a0c12] text-white/80 hover:border-[#8b5cf6]/40'
                }`}
              >
                <span className="text-[#a78bfa] font-bold mr-2">{letras[i] ?? i + 1})</span>
                {op}
              </button>
            ))}
          </div>
        )}

        {conteudo.quizTipo === 'vf' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setVfSelecionado(true)
                setEstado('idle')
              }}
              className={`flex-1 rounded-xl border py-3 font-semibold transition-colors ${
                vfSelecionado === true
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                  : 'border-[#2a2d3a] bg-[#0a0c12] text-white/80'
              }`}
            >
              {messages.exercicio.verdadeiro}
            </button>
            <button
              type="button"
              onClick={() => {
                setVfSelecionado(false)
                setEstado('idle')
              }}
              className={`flex-1 rounded-xl border py-3 font-semibold transition-colors ${
                vfSelecionado === false
                  ? 'border-red-500/50 bg-red-500/10 text-red-300'
                  : 'border-[#2a2d3a] bg-[#0a0c12] text-white/80'
              }`}
            >
              {messages.exercicio.falso}
            </button>
          </div>
        )}

        {conteudo.quizTipo === 'reflexao' && (
          <textarea
            value={textoReflexao}
            onChange={e => {
              setTextoReflexao(e.target.value)
              setEstado('idle')
            }}
            placeholder={conteudo.placeholder ?? messages.exercicio.reflexaoPlaceholder}
            className="w-full min-h-[8rem] bg-[#0a0c12] border border-[#2a2d3a] rounded-xl p-3 text-white/90 text-base leading-relaxed resize-none outline-none focus:border-[#8b5cf6] transition-colors placeholder-white/25"
            style={{ fontSize: '16px' }}
            spellCheck
          />
        )}

        <AnimatePresence>
          {estado === 'erro' && (
            <motion.div
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-red-300 text-sm">💡 {dicaAtual || mensagemErro}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto space-y-2">
          <Button
            onClick={verificar}
            fullWidth
            size="lg"
            loading={estado === 'verificando' || validandoServidor}
            disabled={estado === 'acerto' || validandoServidor}
          >
            {messages.exercicio.verificar}
          </Button>
          {estado === 'erro' && (
            <Button onClick={pedirDica} fullWidth variant="ghost" size="sm">
              {isPro ? messages.exercicio.dica : messages.exercicio.dicaAnuncio}
            </Button>
          )}
        </div>

        {showAnuncioDica && (
          <AnuncioVideo isPro={false} adType="rewarded" label="Anúncio" onConcluido={liberarDica} onFechar={() => setShowAnuncioDica(false)} />
        )}

        <AnimatePresence>
          {showModal && (
            <ModalEstrelas estrelas={estrelasFinalRef.current} xp={xpModal} isPro={isPro} onContinuar={continuar} />
          )}
        </AnimatePresence>
      </div>
    </DesafioSeguro>
  )
}

function PainelPerformanceAviso({
  aviso,
  onOtimizar,
  onContinuar,
}: {
  aviso: string
  onOtimizar: () => void
  onContinuar: () => void
}) {
  const { messages } = useLocale()
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative z-10 w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-[#12141c] border border-amber-500/40 rounded-3xl p-8 text-center shadow-2xl"
        initial={{ y: 80, scale: 0.92 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 80, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-amber-400 font-bold text-lg mb-2">{messages.exercicio.queryLenta}</p>
        <p className="text-white/70 text-sm leading-relaxed mb-6">{aviso}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={onOtimizar} fullWidth size="lg">
            {messages.exercicio.otimizar}
          </Button>
          <button
            onClick={onContinuar}
            className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            {messages.exercicio.continuarAssim}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function TelaExercicio({ titulo, etapaId, conteudo, xpReward, isPro, onConcluido }: TelaExercicioProps) {
  if (isQuizExercicio(conteudo)) {
    return (
      <ExercicioQuiz titulo={titulo} etapaId={etapaId} conteudo={conteudo} isPro={isPro} onConcluido={onConcluido} />
    )
  }

  const conteudoSql = conteudo as ConteudoExercicioSql
  const { messages } = useLocale()
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensagemErro, setMensagemErro] = useState('')
  const [dicaAtual, setDicaAtual] = useState('')
  const [resultado, setResultado] = useState<QueryResult | null>(null)
  const [tentativas, setTentativas] = useState(0)
  const [dicasUsadas, setDicasUsadas] = useState(0)
  const [showAnuncioDica, setShowAnuncioDica] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPerformanceAviso, setShowPerformanceAviso] = useState(false)
  const [validandoServidor, setValidandoServidor] = useState(false)
  const { ready, run } = useSQL()
  const dicaPendenteRef = useRef('')
  const estrelasFinalRef = useRef(0)
  const tokenRef = useRef('')
  const toolbarDragRef = useRef(false)
  const toolbarStartXRef = useRef(0)

  function resolverDica() {
    const tipo = mensagemErro ? classificarErro(mensagemErro) : 'generico'
    return tentativas >= 2 ? conteudoSql.dica : getDica(tipo)
  }

  function pedirDica() {
    setDicasUsadas(prev => prev + 1)
    const dica = resolverDica()
    if (!isPro) {
      dicaPendenteRef.current = dica
      setShowAnuncioDica(true)
    } else {
      setDicaAtual(dica)
    }
  }

  function liberarDica() {
    setShowAnuncioDica(false)
    setDicaAtual(dicaPendenteRef.current)
  }

  async function verificar() {
    if (!ready || !query.trim()) return
    setEstado('verificando')
    setDicaAtual('')

    const novaTentativa = tentativas + 1
    setTentativas(novaTentativa)

    try {
      const rows = run(conteudoSql.schema, query)
      setResultado(rows[0] ? { columns: rows[0].columns, values: rows[0].values as unknown[][] } : null)

      const correto = checkAnswer(rows as any, conteudoSql.checkType, conteudoSql.checkConfig)

      if (correto) {
        const queryLenta = conteudoSql.performanceAviso && detectaQueryLenta(query)
        const estrelas = queryLenta
          ? Math.min(2, calcularEstrelas(novaTentativa, dicasUsadas))
          : calcularEstrelas(novaTentativa, dicasUsadas)
        estrelasFinalRef.current = estrelas

        // Server-side validation: prevents XP farming without actually solving the exercise.
        // The server re-runs the query independently and issues a signed token.
        setValidandoServidor(true)
        try {
          const res = await fetch('/api/validar-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              etapaId,
              query,
              tentativas: novaTentativa,
              dicasUsadas,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.sucesso && data.token) {
              tokenRef.current = data.token
            }
          }
        } catch {
          // Network error — token stays empty; /api/progresso will reject the claim
        } finally {
          setValidandoServidor(false)
        }

        setEstado(queryLenta ? 'performance_aviso' : 'acerto')
        if (queryLenta) {
          setShowPerformanceAviso(true)
        } else {
          setShowModal(true)
        }
      } else {
        setEstado('erro')
        setMensagemErro(messages.exercicio.resultadoIncorreto)
        setDicaAtual(getDica('generico'))
      }
    } catch (e: any) {
      setEstado('erro')
      const msg = e?.message ?? 'Erro ao executar SQL'
      setMensagemErro(msg)
      setDicaAtual(getDica(classificarErro(msg)))
    }
  }

  async function continuar() {
    let token = tokenRef.current
    // Se o token ficou vazio (falha na validação do servidor durante verificar()),
    // tenta novamente antes de salvar o progresso.
    if (!token) {
      try {
        const res = await fetch('/api/validar-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ etapaId, query, tentativas, dicasUsadas }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.sucesso && data.token) {
            token = data.token
            tokenRef.current = token
          }
        }
      } catch { /* token permanece vazio; /api/progresso vai rejeitar */ }
    }
    onConcluido(estrelasFinalRef.current, dicasUsadas, tentativas, token)
  }

  function continuarComQueryLenta() {
    setShowPerformanceAviso(false)
    setEstado('acerto')
    setShowModal(true)
  }

  function tentarOtimizar() {
    setShowPerformanceAviso(false)
    setEstado('idle')
    setTentativas(prev => prev - 1) // não conta esta tentativa como errada
  }

  const xpModal = XP_POR_ESTRELAS[estrelasFinalRef.current] ?? 0

  return (
    <DesafioSeguro>
    <div className="flex flex-col h-full px-4 py-6 gap-4">
      <div>
        <div className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-widest mb-1">{titulo}</div>
        <EnunciadoSeguro texto={conteudoSql.instrucao} className="text-white/80 text-base leading-snug" />
      </div>

      {/* Editor SQL */}
      <div className="relative flex-shrink-0">
        <textarea
          value={query}
          onChange={e => { setQuery(e.target.value); setEstado('idle') }}
          placeholder={messages.exercicio.placeholder}
          className="w-full h-32 bg-[#0a0c12] border border-[#2a2d3a] rounded-xl p-3 text-[#34d399] font-mono resize-none outline-none focus:border-[#8b5cf6] transition-colors placeholder-white/20"
          style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="text"
        />
        {/* SQL quick-insert toolbar — only visible on touch devices */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 md:hidden">
          {['SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', '*', ';', '(', ')', "'", '_', '%', ',', '='].map(key => (
            <button
              key={key}
              type="button"
              onPointerDown={e => {
                toolbarStartXRef.current = e.clientX
                toolbarDragRef.current = false
              }}
              onPointerMove={e => {
                if (Math.abs(e.clientX - toolbarStartXRef.current) > 6) {
                  toolbarDragRef.current = true
                }
              }}
              onPointerCancel={() => {
                toolbarDragRef.current = true
              }}
              onPointerUp={e => {
                if (toolbarDragRef.current) return
                e.preventDefault()
                const ta = e.currentTarget.closest('.relative')?.querySelector('textarea') as HTMLTextAreaElement | null
                if (!ta) return
                const start = ta.selectionStart ?? query.length
                const end = ta.selectionEnd ?? query.length
                const insert = key.includes(' ') ? ` ${key} ` : key
                const next = query.slice(0, start) + insert + query.slice(end)
                setQuery(next)
                setEstado('idle')
                requestAnimationFrame(() => {
                  ta.focus()
                  ta.setSelectionRange(start + insert.length, start + insert.length)
                })
              }}
              className="flex-shrink-0 px-2.5 py-1 bg-[#1e2028] border border-[#2a2d3a] rounded-lg text-[#a78bfa] font-mono text-xs whitespace-nowrap active:bg-[#8b5cf6]/20"
            >
              {key}
            </button>
          ))}
        </div>
        {!ready && (
          <div className="absolute inset-0 bg-[#080a0f]/80 rounded-xl flex items-center justify-center">
            <span className="text-white/40 text-sm animate-pulse">{messages.exercicio.iniciando}</span>
          </div>
        )}
      </div>

      {/* Feedback de erro */}
      <AnimatePresence>
        {estado === 'erro' && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-2"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-red-300 text-sm">💡 {dicaAtual || mensagemErro}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultado da query */}
      {resultado && resultado.columns.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#2a2d3a] bg-[#0a0c12] flex-shrink-0 max-h-36">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                {resultado.columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left text-white/40 font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultado.values.slice(0, 10).map((row, i) => (
                <tr key={i} className="border-b border-[#1e2028]">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 text-[#34d399]">{String(cell ?? 'NULL')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ações */}
      <div className="mt-auto space-y-2">
        <Button
          onClick={verificar}
          fullWidth
          size="lg"
          loading={estado === 'verificando' || validandoServidor}
          disabled={!ready || !query.trim() || estado === 'acerto' || estado === 'performance_aviso' || validandoServidor}
        >
          {messages.exercicio.verificar}
        </Button>
        {estado === 'erro' && (
          <Button onClick={pedirDica} fullWidth variant="ghost" size="sm">
            {isPro ? messages.exercicio.dica : messages.exercicio.dicaAnuncio}
          </Button>
        )}
      </div>

      {/* Anúncio premiado antes de revelar a dica */}
      {showAnuncioDica && (
        <AnuncioVideo isPro={false} adType="rewarded" label="Anúncio" onConcluido={liberarDica} onFechar={() => setShowAnuncioDica(false)} />
      )}

      {/* Painel de aviso de performance (query lenta detectada) */}
      <AnimatePresence>
        {showPerformanceAviso && conteudoSql.performanceAviso && (
          <PainelPerformanceAviso
            aviso={conteudoSql.performanceAviso}
            onOtimizar={tentarOtimizar}
            onContinuar={continuarComQueryLenta}
          />
        )}
      </AnimatePresence>

      {/* Modal de conclusão com estrelas */}
      <AnimatePresence>
        {showModal && (
          <ModalEstrelas
            estrelas={estrelasFinalRef.current}
            xp={xpModal}
            explicacaoTecnica={conteudoSql.explicacaoTecnica}
            isPro={isPro}
            onContinuar={continuar}
          />
        )}
      </AnimatePresence>
    </div>
    </DesafioSeguro>
  )
}
