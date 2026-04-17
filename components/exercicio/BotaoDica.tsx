'use client'
import { motion } from 'framer-motion'
import { useLocale } from '@/context/LocaleContext'

interface BotaoDicaProps {
  isPro: boolean
  dicasReveladas: number
  totalDicas: number
  jaTentouOuErrou: boolean
  podeVerMaisDicas: boolean
  concluido: boolean
  onClick: () => void
}

export function BotaoDica({
  isPro,
  dicasReveladas,
  totalDicas,
  jaTentouOuErrou,
  podeVerMaisDicas,
  concluido,
  onClick,
}: BotaoDicaProps) {
  const { messages } = useLocale()

  if (!jaTentouOuErrou || !podeVerMaisDicas || concluido) return null

  /* --- Labels dinâmicos --- */
  let label: string
  let sublabel: string | null = null

  if (isPro) {
    label = messages.exercicio.dica
  } else if (dicasReveladas === 0) {
    label = '💡 Ver dica'
    sublabel = 'Assistir 1 anúncio'
  } else {
    label = `💡 Ver dica ${dicasReveladas + 1} de ${totalDicas}`
    sublabel = 'Assistir 1 anúncio'
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={[
        'w-full flex items-center justify-center gap-2 rounded-2xl border px-4 transition-colors',
        'py-3',
        isPro
          ? 'border-amber-500/30 bg-amber-500/8 text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/50'
          : 'border-[#2a2d3a] bg-[#0f1117] text-white/60 hover:bg-[#1a1d27] hover:text-white/80 hover:border-[#3a3d4a]',
      ].join(' ')}
    >
      <span className="text-sm font-semibold leading-tight">{label}</span>
      {sublabel && (
        <>
          <span className="w-px h-3.5 bg-white/15 shrink-0" />
          <span className="text-xs text-white/35 font-medium">{sublabel}</span>
        </>
      )}
    </motion.button>
  )
}
