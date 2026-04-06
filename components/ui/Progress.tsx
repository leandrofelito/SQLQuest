import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  barStyle?: React.CSSProperties
  showLabel?: boolean
}

export function Progress({ value, max = 100, className, barClassName, barStyle, showLabel = false }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('relative w-full', className)}>
      <div className="w-full bg-[#1e2028] rounded-full overflow-hidden h-2">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barClassName ?? 'bg-[#8b5cf6]')}
          style={{ width: `${pct}%`, ...barStyle }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-5 text-xs text-white/40">{Math.round(pct)}%</span>
      )}
    </div>
  )
}
