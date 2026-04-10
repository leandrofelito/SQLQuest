'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
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
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    setLocaleState(readCookie())
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    writeCookie(l)
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages: getMessages(locale) }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
