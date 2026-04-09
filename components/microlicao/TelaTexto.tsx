'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import type { ConteudoTexto, BlocoTexto } from '@/types'

interface TelaTextoProps {
  titulo: string
  conteudo: ConteudoTexto
  onContinuar: () => void
}

function RenderBloco({ bloco }: { bloco: BlocoTexto }) {
  if (typeof bloco === 'string') {
    return (
      <p className="text-xl text-white leading-relaxed font-medium">{bloco}</p>
    )
  }

  if (bloco.type === 'code') {
    return (
      <div className="space-y-3 w-full">
        <div className="bg-[#0a0c12] border border-[#2a2d3a] rounded-xl p-4 overflow-x-auto">
          <pre className="text-[#34d399] font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">{bloco.code}</pre>
        </div>
        {bloco.lese && (
          <div className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/25 rounded-xl px-4 py-3">
            <span className="text-[#a78bfa] text-xs font-bold uppercase tracking-wide">Lê-se: </span>
            <span className="text-white/80 text-sm leading-relaxed">{bloco.lese}</span>
          </div>
        )}
      </div>
    )
  }

  if (bloco.type === 'nota') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 flex gap-3">
        <span className="text-amber-400 text-lg flex-shrink-0">💡</span>
        <p className="text-amber-100/90 text-base leading-relaxed">{bloco.texto}</p>
      </div>
    )
  }

  if (bloco.type === 'definicao') {
    return (
      <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-4 space-y-1">
        <span className="text-[#a78bfa] font-bold text-base">{bloco.termo}</span>
        <p className="text-white/70 text-base leading-relaxed">{bloco.def}</p>
      </div>
    )
  }

  return null
}

export function TelaTexto({ titulo, conteudo, onContinuar }: TelaTextoProps) {
  const [blocoAtual, setBlocoAtual] = useState(0)
  const total = conteudo.blocos.length
  const isUltimo = blocoAtual === total - 1

  function avancar() {
    if (isUltimo) {
      onContinuar()
    } else {
      setBlocoAtual(b => b + 1)
    }
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      {/* Dots de progresso */}
      <div className="flex items-center gap-1.5 mb-8">
        {conteudo.blocos.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= blocoAtual ? '#8b5cf6' : '#1e2028' }}
          />
        ))}
      </div>

      <div className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-widest mb-3">
        {titulo}
      </div>

      <div className="flex-1 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={blocoAtual}
            className="w-full"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <RenderBloco bloco={conteudo.blocos[blocoAtual]} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 pb-6 flex gap-3">
        {blocoAtual > 0 && (
          <Button onClick={() => setBlocoAtual(b => b - 1)} variant="secondary" size="lg" className="flex-1">
            ← Voltar
          </Button>
        )}
        <Button onClick={avancar} size="lg" className="flex-1">
          {isUltimo ? 'Continuar →' : 'Próximo'}
        </Button>
      </div>
    </div>
  )
}
