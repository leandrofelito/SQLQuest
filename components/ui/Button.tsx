'use client'
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, className, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 active:scale-95 select-none'

    const variants = {
      primary: 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg shadow-purple-900/30',
      secondary: 'bg-[#1e2028] hover:bg-[#2a2d3a] text-white border border-[#2a2d3a] hover:border-[#363a4a]',
      ghost: 'bg-transparent hover:bg-[#1e2028] text-[#a78bfa]',
      danger: 'bg-[#ef4444] hover:bg-[#dc2626] text-white',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-50 cursor-not-allowed active:scale-100',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
