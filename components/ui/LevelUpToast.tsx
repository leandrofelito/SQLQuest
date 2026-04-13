'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { getLevelBadge } from '@/lib/xp'
import { useLocale } from '@/context/LocaleContext'

interface LevelUpToastProps {
  nivelAnterior: number
  nivelAtual: number
  /** Chamado após o auto-dismiss (3.5s) ou clique */
  onDismiss: () => void
}

/**
 * Toast discreto exibido no canto superior direito quando o usuário sobe de nível.
 * Auto-dismiss em 3.5s. Clicar também dispensa.
 */
export function LevelUpToast({ nivelAnterior, nivelAtual, onDismiss }: LevelUpToastProps) {
  const { messages, locale } = useLocale()
  const badge = getLevelBadge(nivelAtual, locale)

  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.button
      onClick={onDismiss}
      className="fixed top-20 right-4 z-[100] text-left cursor-pointer"
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <div
        className="rounded-2xl px-4 py-3 border"
        style={{
          background: 'rgba(14,16,24,0.97)',
          borderColor: badge.cor + '55',
          boxShadow: `0 0 20px ${badge.brilho}, 0 8px 32px rgba(0,0,0,0.5)`,
          minWidth: 170,
        }}
      >
        {/* Linha superior colorida */}
        <div
          className="absolute top-0 left-4 right-4 h-px rounded-full"
          style={{ background: badge.cor, opacity: 0.6 }}
        />

        <p
          className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
          style={{ color: badge.cor + 'aa' }}
        >
          {messages.levelup.titulo}
        </p>

        <p className="font-black text-base text-white leading-none">
          <span style={{ color: badge.cor + 'bb' }}>{nivelAnterior}</span>
          <span className="text-white/20 mx-1.5 text-sm font-normal">→</span>
          <span style={{ color: badge.cor }}>{nivelAtual}</span>
        </p>

        <p className="text-white/35 text-[10px] mt-1 font-medium">
          {badge.emoji} {badge.nome}
        </p>
      </div>
    </motion.button>
  )
}
