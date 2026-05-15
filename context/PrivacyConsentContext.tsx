'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { getAdsenseScriptSrc } from '@/lib/adsense-config'

type ConsentValue = 'unknown' | 'accepted' | 'rejected'

interface PrivacyConsentContextValue {
  adsConsent: ConsentValue
  canLoadAds: boolean
  acceptAds: () => void
  rejectAds: () => void
  resetAdsConsent: () => void
}

const STORAGE_KEY = 'sqlquest_ads_consent_v1'
const COOKIE_NAME = 'sqlquest_ads_consent'

const PrivacyConsentContext = createContext<PrivacyConsentContextValue>({
  adsConsent: 'unknown',
  canLoadAds: false,
  acceptAds: () => {},
  rejectAds: () => {},
  resetAdsConsent: () => {},
})

function writeConsentCookie(value: Exclude<ConsentValue, 'unknown'>) {
  document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=31536000;SameSite=Lax`
}

function clearConsentCookie() {
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`
}

function readStoredConsent(): ConsentValue {
  if (typeof window === 'undefined') return 'unknown'
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'accepted' || value === 'rejected' ? value : 'unknown'
}

function AdsScriptLoader({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const src = getAdsenseScriptSrc()
    if (!src) return
    if (document.querySelector(`script[data-sqlquest-adsense="true"]`)) return

    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = src
    script.dataset.sqlquestAdsense = 'true'
    document.head.appendChild(script)
  }, [enabled])

  return null
}

function CookieConsentBanner() {
  const { adsConsent, acceptAds, rejectAds } = usePrivacyConsent()
  if (adsConsent !== 'unknown') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-[calc(1rem+var(--safe-area-bottom,0px))]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#10131b]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Privacidade e publicidade</p>
            <p className="text-xs leading-relaxed text-white/60">
              Usamos cookies essenciais para login e preferências. Cookies de publicidade só são
              ativados se você permitir. Você pode continuar usando o SQLQuest recusando anúncios
              personalizados.
            </p>
            <Link href="/privacidade" className="text-xs font-semibold text-[#a78bfa] hover:underline">
              Ver política de privacidade
            </Link>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-44">
            <button
              type="button"
              onClick={acceptAds}
              className="rounded-xl bg-[#8b5cf6] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#7c3aed]"
            >
              Permitir anúncios
            </button>
            <button
              type="button"
              onClick={rejectAds}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
            >
              Recusar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PrivacyConsentProvider({ children }: { children: ReactNode }) {
  const [adsConsent, setAdsConsent] = useState<ConsentValue>('unknown')

  useEffect(() => {
    setAdsConsent(readStoredConsent())
  }, [])

  const setStoredConsent = useCallback((value: Exclude<ConsentValue, 'unknown'>) => {
    window.localStorage.setItem(STORAGE_KEY, value)
    writeConsentCookie(value)
    setAdsConsent(value)
  }, [])

  const acceptAds = useCallback(() => setStoredConsent('accepted'), [setStoredConsent])
  const rejectAds = useCallback(() => setStoredConsent('rejected'), [setStoredConsent])
  const resetAdsConsent = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    clearConsentCookie()
    setAdsConsent('unknown')
  }, [])

  const value = useMemo<PrivacyConsentContextValue>(
    () => ({
      adsConsent,
      canLoadAds: adsConsent === 'accepted',
      acceptAds,
      rejectAds,
      resetAdsConsent,
    }),
    [acceptAds, adsConsent, rejectAds, resetAdsConsent],
  )

  return (
    <PrivacyConsentContext.Provider value={value}>
      <AdsScriptLoader enabled={value.canLoadAds} />
      {children}
      <CookieConsentBanner />
    </PrivacyConsentContext.Provider>
  )
}

export function usePrivacyConsent() {
  return useContext(PrivacyConsentContext)
}
