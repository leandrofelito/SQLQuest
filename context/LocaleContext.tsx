'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { type Locale, DEFAULT_LOCALE, COOKIE_NAME, getMessages } from '@/lib/locale'
import ptMessages from '@/messages/pt.json'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  messages: typeof ptMessages
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  messages: getMessages(DEFAULT_LOCALE),
})

function readCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  const val = match?.[1] as Locale | undefined
  return val === 'en' || val === 'es' || val === 'pt' ? val : DEFAULT_LOCALE
}

function writeCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=31536000;SameSite=Lax`
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [dbLoaded, setDbLoaded] = useState(false)

  // Carrega do cookie imediatamente
  useEffect(() => {
    setLocaleState(readCookie())
  }, [])

  // Quando a sessão estiver disponível, busca a preferência do banco (uma vez)
  useEffect(() => {
    if (status !== 'authenticated' || dbLoaded) return
    fetch('/api/user/language')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.language_preference) {
          const lang = data.language_preference as Locale
          setLocaleState(lang)
          writeCookie(lang)
        }
      })
      .catch(() => {})
      .finally(() => setDbLoaded(true))
  }, [status, dbLoaded])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    writeCookie(l)
    // Persiste no banco se estiver autenticado
    if (session?.user) {
      fetch('/api/user/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language_preference: l }),
      }).catch(() => {})
    }
  }, [session])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages: getMessages(locale) }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
