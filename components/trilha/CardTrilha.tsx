'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'

interface CardTrilhaProps {
  trilha: {
    id: string
    slug: string
    titulo: string
    icone: string
    ordem: number
    totalEtapas: number
    percentualConcluido?: number
    etapasConcluidas?: number
  }
  desbloqueada: boolean
  index: number
  onBloqueadaClick?: () => void
}

export function CardTrilha({ trilha, desbloqueada, index, onBloqueadaClick }: CardTrilhaProps) {
  const router = useRouter()
  const pct = trilha.percentualConcluido ?? 0
  const concluida = pct === 100

  const border = concluida
    ? 'border-emerald-500/40'
    : desbloqueada && pct > 0
    ? 'border-[#8b5cf6]/40'
    : desbloqueada
    ? 'border-[#2a2d3a]'
    : 'border-[#1e2028]'

  function handleClick() {
    if (!desbloqueada) {
      onBloqueadaClick?.()
      return
    }
    router.push(`/trilha/${trilha.slug}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={handleClick}
      className={cn(
        'relative w-[165px] rounded-2xl border bg-[#0f1117] cursor-pointer select-none overflow-hidden',
        border,
        !desbloqueada && 'opacity-60'
      )}
    >
      {/* Badge de progresso */}
      {desbloqueada && pct > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            concluida ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
          )}>
            {concluida ? '✓' : `${pct}%`}
          </span>
        </div>
      )}

      {/* Ícone */}
      <div className="h-[110px] flex items-center justify-center bg-gradient-to-b from-[#161820] to-[#0f1117]">
        {!desbloqueada ? (
          <span className="text-4xl opacity-50">🔒</span>
        ) : (
          <span className="text-5xl">{trilha.icone}</span>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pt-2 pb-3 space-y-2">
        <p className="text-[11px] font-bold text-white leading-tight">{trilha.titulo}</p>

        <Progress
          value={pct}
          barClassName={concluida ? 'bg-emerald-400' : 'bg-[#8b5cf6]'}
          className="h-1"
        />

        <div className={cn(
          'text-center text-[11px] font-bold py-1.5 rounded-lg',
          concluida
            ? 'bg-emerald-500/10 text-emerald-400'
            : desbloqueada && pct > 0
            ? 'bg-[#8b5cf6]/10 text-[#a78bfa]'
            : desbloqueada
            ? 'bg-[#8b5cf6] text-white'
            : 'bg-[#1e2028] text-white/30'
        )}>
          {concluida ? 'Concluída ✓' : desbloqueada && pct > 0 ? 'Continuar →' : desbloqueada ? 'Iniciar' : '🔒 Bloqueada'}
        </div>
      </div>
    </motion.div>
  )
}
