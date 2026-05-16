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
  canLoadPersonalizedAds: boolean
  canAuthenticate: boolean
  acceptAds: () => void
  rejectAds: () => void
  resetAdsConsent: () => void
}

export const PRIVACY_CONSENT_STORAGE_KEY = 'sqlquest_ads_consent_v1'
export const PRIVACY_CONSENT_COOKIE_NAME = 'sqlquest_ads_consent'

const PrivacyConsentContext = createContext<PrivacyConsentContextValue>({
  adsConsent: 'unknown',
  canLoadAds: false,
  canLoadPersonalizedAds: false,
  canAuthenticate: false,
  acceptAds: () => {},
  rejectAds: () => {},
  resetAdsConsent: () => {},
})

function writeConsentCookie(value: Exclude<ConsentValue, 'unknown'>) {
  document.cookie = `${PRIVACY_CONSENT_COOKIE_NAME}=${value};path=/;max-age=31536000;SameSite=Lax`
}

function clearConsentCookie() {
  document.cookie = `${PRIVACY_CONSENT_COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`
}

function readStoredConsent(): ConsentValue {
  if (typeof window === 'undefined') return 'unknown'
  const value = window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY)
  return value === 'accepted' || value === 'rejected' ? value : 'unknown'
}

function AdsScriptLoader({ enabled, nonPersonalized }: { enabled: boolean; nonPersonalized: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const src = getAdsenseScriptSrc()
    if (!src) return
    const ads = ((window as any).adsbygoogle = (window as any).adsbygoogle || [])
    ads.requestNonPersonalizedAds = nonPersonalized ? 1 : 0
    if (document.querySelector(`script[data-sqlquest-adsense="true"]`)) return

    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = src
    script.dataset.sqlquestAdsense = 'true'
    document.head.appendChild(script)
  }, [enabled, nonPersonalized])

  return null
}

function CookieConsentBanner() {
  const { adsConsent, acceptAds, rejectAds } = usePrivacyConsent()
  if (adsConsent !== 'unknown') return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 px-3 pb-[calc(0.75rem+var(--safe-area-bottom,0px))] pt-6 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#10131b] p-4 shadow-2xl sm:p-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-base font-bold text-white">Privacidade e cookies</p>
            <p className="text-sm leading-relaxed text-white/65">
              Usamos cookies essenciais e armazenamento local para manter seu login, salvar
              preferências e proteger sua conta. Esses recursos são necessários para usar a área
              logada.
            </p>
            <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs leading-relaxed text-yellow-100/85">
              A publicidade personalizada é opcional. Você pode permitir anúncios personalizados ou
              continuar com anúncios não personalizados.
            </p>
            <Link href="/privacidade" className="text-xs font-semibold text-[#a78bfa] hover:underline">
              Ver política de privacidade
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={acceptAds}
              className="min-h-12 rounded-xl bg-[#8b5cf6] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#7c3aed]"
            >
              Aceitar e permitir anúncios
            </button>
            <button
              type="button"
              onClick={rejectAds}
              className="min-h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
            >
              Continuar sem anúncios personalizados
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
    window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, value)
    writeConsentCookie(value)
    setAdsConsent(value)
  }, [])

  const acceptAds = useCallback(() => setStoredConsent('accepted'), [setStoredConsent])
  const rejectAds = useCallback(() => setStoredConsent('rejected'), [setStoredConsent])
  const resetAdsConsent = useCallback(() => {
    window.localStorage.removeItem(PRIVACY_CONSENT_STORAGE_KEY)
    clearConsentCookie()
    setAdsConsent('unknown')
  }, [])

  const value = useMemo<PrivacyConsentContextValue>(
    () => ({
      adsConsent,
      canLoadAds: adsConsent !== 'unknown',
      canLoadPersonalizedAds: adsConsent === 'accepted',
      canAuthenticate: adsConsent !== 'unknown',
      acceptAds,
      rejectAds,
      resetAdsConsent,
    }),
    [acceptAds, adsConsent, rejectAds, resetAdsConsent],
  )

  return (
    <PrivacyConsentContext.Provider value={value}>
      <AdsScriptLoader enabled={value.canLoadAds} nonPersonalized={!value.canLoadPersonalizedAds} />
      {children}
      <CookieConsentBanner />
    </PrivacyConsentContext.Provider>
  )
}

export function usePrivacyConsent() {
  return useContext(PrivacyConsentContext)
}
