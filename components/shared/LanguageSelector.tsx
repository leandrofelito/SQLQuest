'use client'
import { useLocale } from '@/context/LocaleContext'
import type { Locale } from '@/lib/locale'

const OPTIONS: { value: Locale; flag: string; short: string; beta?: boolean }[] = [
  { value: 'pt', flag: '🇧🇷', short: 'PT', beta: true },
  { value: 'en', flag: '🇺🇸', short: 'EN' },
  { value: 'es', flag: '🇪🇸', short: 'ES', beta: true },
]

const CONFIRM_MSG: Record<Locale, string> = {
  pt: 'Trocar para Português? O app será recarregado.',
  en: 'Switch to English? The app will reload.',
  es: '¿Cambiar a Español? La app se recargará.',
}

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale()

  function handleChange(lang: Locale) {
    if (lang === locale) return
    if (!window.confirm(CONFIRM_MSG[lang])) return
    setLocale(lang)
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          title={opt.value === 'pt' ? 'Português' : opt.value === 'en' ? 'English' : 'Español'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
            locale === opt.value
              ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/40'
              : 'text-white/30 hover:text-white/60 border border-transparent'
          }`}
        >
          <span>{opt.flag}</span>
          {!compact && <span>{opt.short}</span>}
          {opt.beta && (
            <span className="text-[9px] font-bold text-yellow-400/80 leading-none">Beta</span>
          )}
        </button>
      ))}
    </div>
  )
}
