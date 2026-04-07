'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useSQL } from '@/hooks/useSQL'
import { checkAnswer } from '@/lib/check-answer'
import { getDica, classificarErro } from '@/lib/dicas'
import { calcularEstrelas, XP_POR_ESTRELAS } from '@/lib/xp'
import { AnuncioVideo } from '@/components/anuncio/AnuncioVideo'
import { DesafioSeguro, EnunciadoSeguro } from '@/components/seguranca/DesafioSeguro'
import type { ConteudoExercicio, QueryResult } from '@/types'

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

const LABELS_ESTRELAS: Record<number, string> = {
  3: 'Elite!',
  2: 'Bom trabalho!',
  1: 'Continue praticando!',
}

function ModalEstrelas({
  estrelas,
  xp,
  explicacaoTecnica,
  onContinuar,
}: {
  estrelas: number
  xp: number
  explicacaoTecnica?: string
  onContinuar: () => void
}) {
  const [showExplicacao, setShowExplicacao] = useState(false)

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
        className="relative z-10 w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-[#12141c] border border-[#2a2d3a] rounded-3xl p-8 text-center shadow-2xl overflow-y-auto max-h-[90vh]"
        initial={{ y: 80, scale: 0.92 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 80, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Estrelas */}
        <div className="flex justify-center gap-3 mb-5">
          {[1, 2, 3].map(i => {
            const filled = i <= estrelas
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.15 * i,
                  type: 'spring',
                  stiffness: 260,
                  damping: 18,
                }}
              >
                <StarIcon filled={filled} size={40} />
              </motion.div>
            )
          })}
        </div>

        {/* Legenda das estrelas */}
        <motion.div
          className="flex justify-center gap-4 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[1, 2, 3].map(i => {
            const earned = i <= estrelas
            const labels: Record<number, string> = {
              1: 'Acertou',
              2: 'Sem dica',
              3: '1ª tentativa',
            }
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className={`text-[10px] font-semibold ${earned ? 'text-amber-400' : 'text-white/20'}`}>
                  {labels[i]}
                </span>
              </div>
            )
          })}
        </motion.div>

        {/* Título */}
        <motion.p
          className="text-white font-bold text-xl mb-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          {LABELS_ESTRELAS[estrelas]}
        </motion.p>

        {/* XP */}
        <motion.div
          className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 rounded-full px-4 py-1.5 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 250 }}
        >
          <span className="text-amber-400 font-bold text-sm">+{xp} XP</span>
        </motion.div>

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
              <span>🔍 Ver análise do plano de execução</span>
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

        {/* Botão */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
        >
          <Button onClick={onContinuar} fullWidth size="lg">
            Continuar →
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
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
        <p className="text-amber-400 font-bold text-lg mb-2">Query Lenta Detectada</p>
        <p className="text-white/70 text-sm leading-relaxed mb-6">{aviso}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={onOtimizar} fullWidth size="lg">
            Tentar otimizar 🚀
          </Button>
          <button
            onClick={onContinuar}
            className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Continuar assim (2 estrelas)
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function TelaExercicio({ titulo, etapaId, conteudo, xpReward, isPro, onConcluido }: TelaExercicioProps) {
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

  function resolverDica() {
    const tipo = mensagemErro ? classificarErro(mensagemErro) : 'generico'
    return tentativas >= 2 ? conteudo.dica : getDica(tipo)
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
      const rows = run(conteudo.schema, query)
      setResultado(rows[0] ? { columns: rows[0].columns, values: rows[0].values as unknown[][] } : null)

      const correto = checkAnswer(rows as any, conteudo.checkType, conteudo.checkConfig)

      if (correto) {
        const queryLenta = conteudo.performanceAviso && detectaQueryLenta(query)
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
        setMensagemErro('Resultado incorreto. Verifique as colunas e os dados retornados.')
        setDicaAtual(getDica('generico'))
      }
    } catch (e: any) {
      setEstado('erro')
      const msg = e?.message ?? 'Erro ao executar SQL'
      setMensagemErro(msg)
      setDicaAtual(getDica(classificarErro(msg)))
    }
  }

  function continuar() {
    onConcluido(estrelasFinalRef.current, dicasUsadas, tentativas, tokenRef.current)
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
        <EnunciadoSeguro texto={conteudo.instrucao} className="text-white/80 text-base leading-snug" />
      </div>

      {/* Editor SQL */}
      <div className="relative flex-shrink-0">
        <textarea
          value={query}
          onChange={e => { setQuery(e.target.value); setEstado('idle') }}
          placeholder="-- Escreva seu SQL aqui"
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
            <span className="text-white/40 text-sm animate-pulse">Iniciando SQL engine...</span>
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
          Verificar
        </Button>
        {estado === 'erro' && (
          <Button onClick={pedirDica} fullWidth variant="ghost" size="sm">
            💡 {isPro ? 'Ver dica' : 'Ver dica (anúncio)'}
          </Button>
        )}
      </div>

      {/* Anúncio antes de revelar a dica */}
      {showAnuncioDica && (
        <AnuncioVideo isPro={false} label="Anúncio" onConcluido={liberarDica} />
      )}

      {/* Painel de aviso de performance (query lenta detectada) */}
      <AnimatePresence>
        {showPerformanceAviso && conteudo.performanceAviso && (
          <PainelPerformanceAviso
            aviso={conteudo.performanceAviso}
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
            explicacaoTecnica={conteudo.explicacaoTecnica}
            onContinuar={continuar}
          />
        )}
      </AnimatePresence>
    </div>
    </DesafioSeguro>
  )
}
