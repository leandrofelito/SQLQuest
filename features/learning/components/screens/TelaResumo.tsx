'use client'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import type { ConteudoResumo } from '@/types'
import { useLocale } from '@/context/LocaleContext'

interface TelaResumoProps {
  titulo: string
  conteudo: ConteudoResumo
  onContinuar: () => void
}

const COR_MAP = {
  verde: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'text-emerald-400' },
  roxo: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', dot: 'bg-purple-400', label: 'text-purple-400' },
  azul: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400', label: 'text-blue-400' },
  laranja: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400', label: 'text-orange-400' },
}

export function TelaResumo({ titulo, conteudo, onContinuar }: TelaResumoProps) {
  const { messages } = useLocale()
  const cores = COR_MAP[conteudo.cor]

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          className={`rounded-2xl border p-5 space-y-4 ${cores.bg} ${cores.border}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`text-sm font-bold ${cores.label} tracking-wide`}>{messages.resumo.titulo}</div>
          <div className="space-y-3">
            {conteudo.itens.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${cores.dot}`} />
                <span className="text-white/90 text-base leading-snug">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-6" style={{ paddingBottom: 'calc(1.5rem + var(--safe-area-bottom, 0px))' }}>
        <Button onClick={onContinuar} fullWidth size="lg">
          {messages.resumo.proximo}
        </Button>
      </div>
    </div>
  )
}
