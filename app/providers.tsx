'use client'
import { useEffect } from 'react'
import { SessionProvider as NextSessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/context/LocaleContext'
import { AppDataProvider } from '@/context/AppDataContext'
import { PrivacyConsentProvider } from '@/context/PrivacyConsentContext'
import { SessionGuard } from '@/components/layout/SessionGuard'

function NativeAppDetector() {
  useEffect(() => {
    if ((window as any).__sqlquestNativeApp) {
      document.documentElement.classList.add('native-app')
    }
  }, [])
  return null
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextSessionProvider>
      <NativeAppDetector />
      <LocaleProvider>
        <PrivacyConsentProvider>
          <AppDataProvider>
            <SessionGuard />
            {children}
          </AppDataProvider>
        </PrivacyConsentProvider>
      </LocaleProvider>
    </NextSessionProvider>
  )
}
