import ptMessages from '@/messages/pt.json'
import enMessages from '@/messages/en.json'
import esMessages from '@/messages/es.json'

export type Locale = 'pt' | 'en' | 'es'

export const LOCALES: Locale[] = ['pt', 'en', 'es']
export const DEFAULT_LOCALE: Locale = 'pt'
export const COOKIE_NAME = 'sqlquest_locale'

const messages: Record<Locale, typeof ptMessages> = {
  pt: ptMessages,
  en: enMessages as typeof ptMessages,
  es: esMessages as typeof ptMessages,
}

export function getMessages(locale: Locale): typeof ptMessages {
  return messages[locale] ?? messages[DEFAULT_LOCALE]
}

/** Deep-get a dot-separated key from messages, e.g. "nav.trilhas" */
export function t(messages: typeof ptMessages, key: string): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = messages
  for (const part of parts) {
    if (current == null) return key
    current = current[part]
  }
  return typeof current === 'string' ? current : key
}

/** Merge base content (pt) with a translation object for a given locale. */
export function applyLocale<T extends Record<string, unknown>>(
  base: T,
  traducoes: Record<string, Partial<T>> | null | undefined,
  locale: Locale
): T {
  if (!traducoes || locale === DEFAULT_LOCALE) return base
  const translation = traducoes[locale]
  if (!translation) return base
  return { ...base, ...translation }
}
