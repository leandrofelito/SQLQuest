'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { MapaTrilhas } from '@/components/trilha/MapaTrilhas'
import { XpBar } from '@/components/ui/XpBar'
import { useUser } from '@/hooks/useUser'
import { useLocale } from '@/context/LocaleContext'
import { useAppData, type TrilhaComProgresso } from '@/context/AppDataContext'

export default function HomePage() {
  const { user } = useUser()
  const { messages, locale } = useLocale()
  const { loadTrilhas, getCachedTrilhas } = useAppData()
  const [trilhas, setTrilhas] = useState<TrilhaComProgresso[]>(() => getCachedTrilhas() ?? [])
  const [loading, setLoading] = useState(() => getCachedTrilhas() === null)
  const searchParams = useSearchParams()
  const proBought = searchParams.get('pro') === '1'

  useEffect(() => {
    // Sinaliza ao app Flutter que o login foi bem-sucedido
    if (typeof window !== 'undefined' && (window as any).__sqlquestNativeApp) {
      (window as any).SessionBridge?.postMessage('login')
    }
    loadTrilhas(locale).then(data => {
      setTrilhas(data)
      setLoading(false)
    })
  }, [locale])

  const xp = (user as any)?.totalXp ?? 0

  return (
    <div className="min-h-screen bg-[#080a0f] pb-[calc(5rem+var(--safe-area-bottom,0px))]">
      <Header />

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
        {proBought && (
          <div className="mb-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
            <p className="text-purple-300 font-bold">{messages.home.proWelcomeTitle}</p>
            <p className="text-white/50 text-sm mt-1">{messages.home.proWelcomeDesc}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/40 text-xs">{messages.home.hello}</p>
            <p className="text-white font-bold">{user?.name?.split(' ')[0] ?? 'Estudante'}</p>
          </div>
          {(user as any)?.isPro && (
            <span className="bg-[#8b5cf6]/20 text-[#a78bfa] text-xs font-bold px-3 py-1 rounded-full border border-[#8b5cf6]/30">
              {messages.home.proBadge}
            </span>
          )}
        </div>

        <XpBar xp={xp} showStats className="mb-6" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-white/30">Carregando trilhas...</div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <MapaTrilhas trilhas={trilhas} />
        </div>
      )}

      <NavBottom />
    </div>
  )
}
