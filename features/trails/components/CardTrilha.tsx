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
  liberadaPorPro?: boolean
  ultimaTrilha?: boolean
  index: number
  onBloqueadaClick?: () => void
  fullWidth?: boolean
}

export function CardTrilha({ trilha, desbloqueada, liberadaPorPro, ultimaTrilha, index, onBloqueadaClick, fullWidth }: CardTrilhaProps) {
  const router = useRouter()
  const pct = trilha.percentualConcluido ?? 0
  const concluida = pct === 100
  const emAndamento = desbloqueada && pct > 0 && pct < 100

  const border = concluida
    ? 'border-emerald-500/40'
    : emAndamento
    ? 'border-[#8b5cf6]/40'
    : liberadaPorPro
    ? 'border-[#facc15]/40'
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
        'relative rounded-2xl border bg-[#0f1117] cursor-pointer select-none overflow-hidden',
        fullWidth ? 'w-full' : 'w-[175px]',
        'min-h-[260px]',
        border,
        !desbloqueada && !liberadaPorPro && 'opacity-60',
        liberadaPorPro && !desbloqueada && 'opacity-90 shadow-[0_0_12px_rgba(250,204,21,0.12)]'
      )}
    >
      {/* Badge de progresso ou estado */}
      <div className="absolute top-2 right-2 z-10">
        {concluida && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            ✓
          </span>
        )}
        {emAndamento && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
            {pct}%
          </span>
        )}
        {liberadaPorPro && !emAndamento && !concluida && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/30">
            ⭐ PRO
          </span>
        )}
      </div>

      {/* Badge "Parou aqui" */}
      {ultimaTrilha && emAndamento && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Parou aqui
          </span>
        </div>
      )}

      {/* Ícone */}
      <div className="py-8 px-4 flex items-center justify-center bg-gradient-to-b from-[#161820] to-[#0f1117]">
        {!desbloqueada ? (
          <span className="text-5xl opacity-50">🔒</span>
        ) : (
          <span className="text-6xl">{trilha.icone}</span>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-4 space-y-2">
        <p className="text-[12px] font-bold text-white leading-tight">{trilha.titulo}</p>

        <Progress
          value={pct}
          barClassName={concluida ? 'bg-emerald-400' : liberadaPorPro ? 'bg-[#facc15]' : 'bg-[#8b5cf6]'}
          className="h-1"
        />

        <div className={cn(
          'text-center text-[11px] font-bold py-1.5 rounded-lg',
          concluida
            ? 'bg-emerald-500/10 text-emerald-400'
            : emAndamento
            ? 'bg-[#8b5cf6]/10 text-[#a78bfa]'
            : liberadaPorPro
            ? 'bg-[#facc15]/10 text-[#facc15]'
            : desbloqueada
            ? 'bg-[#8b5cf6] text-white'
            : 'bg-[#1e2028] text-white/30'
        )}>
          {concluida
            ? 'Concluída ✓'
            : emAndamento
            ? 'Em andamento →'
            : liberadaPorPro
            ? 'Liberada ✦'
            : desbloqueada
            ? 'Iniciar'
            : '🔒 Bloqueada'}
        </div>
      </div>
    </motion.div>
  )
}
