'use client'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

interface HeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
  right?: React.ReactNode
}

export function Header({ title, showBack = false, backHref = '/home', right }: HeaderProps) {
  const { user } = useUser()

  return (
    <header className="sticky top-0 z-20 bg-[#080a0f]/80 backdrop-blur-sm border-b border-[#1e2028] safe-top">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link href={backHref} className="text-white/60 hover:text-white p-1 -ml-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <Link href="/home" className="text-[#8b5cf6] font-bold text-lg tracking-tight">
              SQL<span className="text-[#FBBF24]">Quest</span>
            </Link>
          )}
          {title && <h1 className="text-white font-bold text-base truncate max-w-[180px]">{title}</h1>}
        </div>
        <div className="flex items-center gap-3">
          {right}
          {user && (
            <Link href="/perfil" className="flex items-center gap-1.5 text-sm">
              <span className="text-amber-400 text-sm">🔥</span>
              <span className="text-white/70 text-sm font-medium">{(user as any).streak ?? 0}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
