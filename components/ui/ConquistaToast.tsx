'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface ConquistaToastProps {
  emoji: string
  nome: string
  onDismiss: () => void
}

export function ConquistaToast({ emoji, nome, onDismiss }: ConquistaToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.button
      onClick={onDismiss}
      className="fixed bottom-24 left-1/2 z-[110] -translate-x-1/2 cursor-pointer"
      initial={{ opacity: 0, y: 40, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl border border-yellow-400/30 px-5 py-3 shadow-2xl"
        style={{ background: 'rgba(20, 18, 6, 0.97)', minWidth: 220 }}
      >
        {/* Linha superior dourada */}
        <div className="absolute top-0 left-6 right-6 h-px rounded-full bg-yellow-400/50" />

        <span className="text-2xl leading-none">{emoji}</span>

        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-400/70 mb-0.5">
            Conquista desbloqueada!
          </p>
          <p className="text-white font-bold text-sm leading-tight">{nome}</p>
        </div>

        {/* Ícone de fechar */}
        <span className="ml-auto text-white/20 text-xs">✕</span>
      </div>
    </motion.button>
  )
}
