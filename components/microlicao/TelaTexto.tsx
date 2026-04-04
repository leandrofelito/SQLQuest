'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import type { ConteudoTexto } from '@/types'

interface TelaTextoProps {
  titulo: string
  conteudo: ConteudoTexto
  onContinuar: () => void
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
          <motion.p
            key={blocoAtual}
            className="text-xl text-white leading-relaxed font-medium"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {conteudo.blocos[blocoAtual]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-8">
        <Button onClick={avancar} fullWidth size="lg">
          {isUltimo ? 'Continuar →' : 'Próximo'}
        </Button>
      </div>
    </div>
  )
}
