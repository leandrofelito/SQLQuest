'use client'
import { SessionProvider as NextSessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/context/LocaleContext'
import { SessionGuard } from '@/components/SessionGuard'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextSessionProvider>
      <SessionGuard />
      <LocaleProvider>{children}</LocaleProvider>
    </NextSessionProvider>
  )
}
