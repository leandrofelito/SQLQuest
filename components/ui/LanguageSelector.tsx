'use client'
import { useLocale } from '@/context/LocaleContext'
import type { Locale } from '@/lib/locale'

const OPTIONS: { value: Locale; flag: string; short: string }[] = [
  { value: 'pt', flag: '🇧🇷', short: 'PT' },
  { value: 'en', flag: '🇺🇸', short: 'EN' },
  { value: 'es', flag: '🇪🇸', short: 'ES' },
]

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          title={opt.value === 'pt' ? 'Português' : opt.value === 'en' ? 'English' : 'Español'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
            locale === opt.value
              ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/40'
              : 'text-white/30 hover:text-white/60 border border-transparent'
          }`}
        >
          <span>{opt.flag}</span>
          {!compact && <span>{opt.short}</span>}
        </button>
      ))}
    </div>
  )
}
