'use client'
import { SessionProvider as NextSessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/context/LocaleContext'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextSessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </NextSessionProvider>
  )
}
