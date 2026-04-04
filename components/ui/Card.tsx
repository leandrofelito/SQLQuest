import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered'
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-[#0f1117]',
    elevated: 'bg-[#161820]',
    bordered: 'bg-[#0f1117] border border-[#2a2d3a]',
  }

  return (
    <div
      className={cn('rounded-2xl overflow-hidden', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}
