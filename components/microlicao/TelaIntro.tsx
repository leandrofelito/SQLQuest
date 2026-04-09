'use client'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import type { ConteudoIntro } from '@/types'

interface TelaIntroProps {
  titulo: string
  conteudo: ConteudoIntro
  onContinuar: () => void
}

export function TelaIntro({ titulo, conteudo, onContinuar }: TelaIntroProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-between h-full px-6 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
        <motion.div
          className="relative"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="absolute inset-0 rounded-full bg-[#8b5cf6]/20 blur-3xl" />
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#8b5cf6]/30 to-[#161820] flex items-center justify-center border border-[#8b5cf6]/30">
            <span className="text-6xl">{conteudo.emoji}</span>
          </div>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-white leading-tight">{titulo}</h1>
          <p className="text-white/50 text-base">{conteudo.subtitulo}</p>
        </motion.div>
      </div>

      <motion.div
        className="w-full pb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button onClick={onContinuar} fullWidth size="lg">
          Toque para Continuar
        </Button>
      </motion.div>
    </motion.div>
  )
}
