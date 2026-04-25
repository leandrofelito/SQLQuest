'use client'
import { motion } from 'framer-motion'
import { getLevelBadge } from '@/features/gamification/domain/xp'
import { useLocale } from '@/context/LocaleContext'

interface LevelUpModalProps {
  nivel: number
  onContinuar: () => void
}

const MILESTONE_LEVELS = new Set([10, 20, 30, 50, 75, 100])

export function LevelUpModal({ nivel, onContinuar }: LevelUpModalProps) {
  const { messages, locale } = useLocale()
  const badge = getLevelBadge(nivel, locale)
  const lu = messages.levelup as typeof messages.levelup & {
    subiu?: string
    continuar?: string
    milestones?: Record<string, string>
  }
  const milestoneLabel = MILESTONE_LEVELS.has(nivel) ? lu.milestones?.[String(nivel)] : undefined
  const isMilestone = Boolean(milestoneLabel)

  // Partículas decorativas
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    delay: i * 0.05,
  }))

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Partículas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{ background: badge.cor, opacity: 0.7 }}
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{
              x: Math.cos((p.angle * Math.PI) / 180) * (120 + Math.random() * 80),
              y: Math.sin((p.angle * Math.PI) / 180) * (120 + Math.random() * 80),
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.2, delay: p.delay + 0.3, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Card principal */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-5 px-8 py-10 rounded-3xl border text-center max-w-xs w-full mx-4"
        style={{
          background: `linear-gradient(135deg, #0f1117 0%, ${badge.bg} 100%)`,
          borderColor: badge.cor,
          boxShadow: `0 0 60px ${badge.brilho}, 0 0 120px ${badge.brilho}`,
        }}
        initial={{ opacity: 0, scale: 0.7, y: 60 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
      >
        {/* Brilho no topo */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full"
          style={{ background: badge.cor, boxShadow: `0 0 20px ${badge.cor}` }}
        />

        {/* Emoji do badge */}
        <motion.div
          className="text-6xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.25 }}
        >
          {badge.emoji}
        </motion.div>

        {/* Subida de nível */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">
            {lu.subiu ?? 'Subiu de nível!'}
          </p>
          <p className="text-white font-black text-5xl leading-none" style={{ color: badge.cor }}>
            {nivel}
          </p>
          <p
            className="text-sm font-bold mt-1 tracking-wide"
            style={{ color: badge.cor }}
          >
            {badge.nome}
          </p>
        </motion.div>

        {/* Badge de marco especial */}
        {isMilestone && (
          <motion.div
            className="px-4 py-1.5 rounded-full text-xs font-bold border"
            style={{
              background: badge.bg,
              borderColor: badge.cor,
              color: badge.cor,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
          >
            {milestoneLabel}
          </motion.div>
        )}

        {/* Botão */}
        <motion.button
          onClick={onContinuar}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-opacity hover:opacity-80 active:scale-95"
          style={{ background: badge.cor, color: '#000' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isMilestone ? 0.8 : 0.65 }}
        >
          {lu.continuar ?? 'Continuar'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
