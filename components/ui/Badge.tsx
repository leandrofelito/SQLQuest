import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

type BadgeVariant = 'purple' | 'green' | 'gold' | 'red' | 'blue' | 'gray' | 'orange'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'purple', className, children, ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    gold: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    red: 'bg-red-500/15 text-red-300 border-red-500/20',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    gray: 'bg-white/5 text-white/50 border-white/10',
    orange: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
