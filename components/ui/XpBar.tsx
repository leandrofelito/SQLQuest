'use client'
import { getLevel, getLevelLabel, getProgressoPct, getXpParaProximo, getLevelBadge } from '@/lib/xp'
import { formatXP } from '@/lib/utils'
import { Progress } from './Progress'
import { useLocale } from '@/context/LocaleContext'

interface XpBarProps {
  xp: number
  showStats?: boolean
  className?: string
}

export function XpBar({ xp, showStats = false, className }: XpBarProps) {
  const { messages, locale } = useLocale()
  const level = getLevel(xp)
  const label = getLevelLabel(xp)
  const pct = getProgressoPct(xp)
  const proximo = getXpParaProximo(xp)
  const badge = getLevelBadge(level, locale)

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[60px] text-center border shrink-0"
          style={{ background: badge.bg, borderColor: badge.cor, color: badge.cor }}
        >
          {label}
        </span>
        <span
          className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border max-w-[200px] sm:max-w-none truncate sm:whitespace-normal"
          style={{ background: badge.bg, borderColor: badge.cor + '88', color: badge.cor }}
          title={`${badge.emoji} ${badge.nome}`}
        >
          {badge.emoji} {badge.nome}
        </span>
        <div className="flex-1 min-w-[100px]">
          <Progress
            value={pct}
            barClassName="transition-all duration-500"
            barStyle={{ background: `linear-gradient(90deg, ${badge.cor}cc, ${badge.cor})` }}
          />
        </div>
        <span className="text-xs text-white/40 whitespace-nowrap">
          {formatXP(xp)} / {formatXP(proximo)} XP
        </span>
      </div>
      {showStats && (
        <div className="flex gap-4 mt-2">
          <div className="text-center">
            <div className="text-xs text-white/40">{messages.xpbar.nivel}</div>
            <div className="text-sm font-bold text-white">{level}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40">{messages.xpbar.xpTotal}</div>
            <div className="text-sm font-bold" style={{ color: badge.cor }}>{formatXP(xp)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/40">{messages.xpbar.proximo}</div>
            <div className="text-sm font-bold text-white">{formatXP(proximo - xp)} XP</div>
          </div>
        </div>
      )}
    </div>
  )
}
