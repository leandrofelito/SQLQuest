'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useSQL } from '@/hooks/useSQL'
import { checkAnswer } from '@/lib/check-answer'
import { getDica, classificarErro } from '@/lib/dicas'
import type { ConteudoExercicio, QueryResult } from '@/types'

interface TelaExercicioProps {
  titulo: string
  conteudo: ConteudoExercicio
  xpReward: number
  onConcluido: (xp: number, usouDica: boolean, tentativas: number, primeiraTentativa: boolean) => void
}

type Estado = 'idle' | 'verificando' | 'erro' | 'acerto'

export function TelaExercicio({ titulo, conteudo, xpReward, onConcluido }: TelaExercicioProps) {
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensagemErro, setMensagemErro] = useState('')
  const [dicaAtual, setDicaAtual] = useState('')
  const [resultado, setResultado] = useState<QueryResult | null>(null)
  const [tentativas, setTentativas] = useState(0)
  const [usouDica, setUsouDica] = useState(false)
  const { ready, run } = useSQL()
  const primeiraTentativaRef = useRef(true)

  function pedirDica() {
    setUsouDica(true)
    if (tentativas >= 2) {
      setDicaAtual(conteudo.dica)
    } else {
      const tipo = mensagemErro ? classificarErro(mensagemErro) : 'generico'
      setDicaAtual(getDica(tipo))
    }
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
        setEstado('acerto')
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
    onConcluido(
      xpReward,
      usouDica,
      tentativas,
      primeiraTentativaRef.current && tentativas === 1
    )
  }

  return (
    <div className="flex flex-col h-full px-4 py-6 gap-4">
      <div>
        <div className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-widest mb-1">{titulo}</div>
        <p className="text-white/80 text-base leading-snug">{conteudo.instrucao}</p>
      </div>

      {/* Editor SQL */}
      <div className="relative flex-shrink-0">
        <textarea
          value={query}
          onChange={e => { setQuery(e.target.value); setEstado('idle') }}
          placeholder={conteudo.placeholder}
          className="w-full h-32 bg-[#0a0c12] border border-[#2a2d3a] rounded-xl p-3 text-[#34d399] font-mono text-sm resize-none outline-none focus:border-[#8b5cf6] transition-colors placeholder-white/20"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
        {!ready && (
          <div className="absolute inset-0 bg-[#080a0f]/80 rounded-xl flex items-center justify-center">
            <span className="text-white/40 text-sm animate-pulse">Iniciando SQL engine...</span>
          </div>
        )}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {estado === 'erro' && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-2"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-red-300 text-sm">💡 {dicaAtual || mensagemErro}</p>
            {tentativas >= 2 && !usouDica && (
              <button
                onClick={pedirDica}
                className="text-xs text-amber-400 underline"
              >
                Ver dica extra
              </button>
            )}
          </motion.div>
        )}

        {estado === 'acerto' && (
          <motion.div
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-2xl mb-1">🎉</div>
            <p className="text-emerald-300 font-semibold">Correto!</p>
            <p className="text-emerald-400/70 text-xs">+{xpReward} XP</p>
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
        {estado === 'acerto' ? (
          <Button onClick={continuar} fullWidth size="lg">
            Continuar →
          </Button>
        ) : (
          <>
            <Button
              onClick={verificar}
              fullWidth
              size="lg"
              loading={estado === 'verificando'}
              disabled={!ready || !query.trim()}
            >
              Verificar
            </Button>
            {estado === 'erro' && tentativas < 2 && (
              <Button onClick={pedirDica} fullWidth variant="ghost" size="sm">
                💡 Mostrar dica
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
