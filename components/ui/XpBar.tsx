'use client'
import { getLevel, getLevelLabel, getProgressoPct, getXpParaProximo } from '@/lib/xp'
import { formatXP } from '@/lib/utils'
import { Progress } from './Progress'

interface XpBarProps {
  xp: number
  showStats?: boolean
  className?: string
}

export function XpBar({ xp, showStats = false, className }: XpBarProps) {
  const level = getLevel(xp)
  const label = getLevelLabel(xp)
  const pct = getProgressoPct(xp)
  const proximo = getXpParaProximo(xp)

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-1.5">
        <span className="bg-[#8b5cf6] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[60px] text-center">
          {label}
        </span>
        <div className="flex-1">
          <Progress value={pct} barClassName="bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]" />
        </div>
        <span className="text-xs text-white/40 whitespace-nowrap">
          {formatXP(xp)} / {formatXP(proximo)} XP
        </span>
      </div>
      {showStats && (
        <div className="flex gap-4 mt-2">
          <div className="text-center">
            <div className="text-xs text-white/40">Nível</div>
            <div className="text-sm font-bold text-white">{level + 1}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40">XP Total</div>
            <div className="text-sm font-bold text-[#a78bfa]">{formatXP(xp)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40">Próximo</div>
            <div className="text-sm font-bold text-white">{formatXP(proximo - xp)} XP</div>
          </div>
        </div>
      )}
    </div>
  )
}
