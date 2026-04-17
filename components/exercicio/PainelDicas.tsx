'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocale } from '@/context/LocaleContext'

interface PainelDicasProps {
  dicasReveladas: string[]
  totalDicas: number
}

export function PainelDicas({ dicasReveladas, totalDicas }: PainelDicasProps) {
  const { messages } = useLocale()

  if (dicasReveladas.length === 0) return null

  return (
    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {dicasReveladas.map((texto, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/8 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-amber-500/15">
              <span className="text-amber-400 text-base leading-none">💡</span>
              <span className="text-amber-300 text-xs font-bold uppercase tracking-widest">
                {messages.exercicio.dicaReveladaTitulo}
                {totalDicas > 1 && (
                  <span className="text-amber-400/70 font-normal ml-1">
                    {i + 1} {messages.exercicio.dicaContadorDe} {totalDicas}
                  </span>
                )}
              </span>
            </div>

            {/* Conteúdo */}
            <p className="px-4 py-3 text-amber-100/90 text-sm leading-relaxed">
              {texto}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
