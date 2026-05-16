'use client'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useLocale } from '@/context/LocaleContext'
import { usePrivacyConsent } from '@/context/PrivacyConsentContext'
import { useNativeAdHost } from '@/hooks/useNativeAdHost'
import {
  getAdsenseClientId,
  getAdsenseBannerSlotId,
  hasAdsenseBannerUnit,
  type AdBannerPlacement,
} from '@/lib/adsense-config'

interface AdBannerProps {
  /** Web: slot dedicado no modal de estrelas (opcional; fallback = banner padrão). */
  placement?: AdBannerPlacement
  /** Rótulo discreto acima do anúncio (boa prática de transparência). */
  showLabel?: boolean
}

export function AdBanner({ placement = 'default', showLabel = false }: AdBannerProps) {
  const { isPro } = useUser()
  const { messages } = useLocale()
  const { canLoadAds, canLoadPersonalizedAds } = usePrivacyConsent()
  const ref = useRef<HTMLDivElement>(null)
  const pushed = useRef(false)
  const nativeHost = useNativeAdHost()
  const [bannerNativeFailed, setBannerNativeFailed] = useState(false)

  useEffect(() => {
    if (isPro || !canLoadAds) return
    if (nativeHost === 'pending') return

    if (nativeHost === 'native') {
      setBannerNativeFailed(false)
      const onResult = (result: string) => {
        if (result === 'failed') setBannerNativeFailed(true)
      }
      ;(window as any).onBannerAdResult = onResult
      // Solicita banner nativo ao AdMob via bridge
      try {
        ;(window as any).AdMobBridge.postMessage(
          JSON.stringify({ action: 'showBanner', nonPersonalizedAds: !canLoadPersonalizedAds }),
        )
      } catch {}
      return () => {
        try {
          delete (window as any).onBannerAdResult
        } catch {}
        try {
          ;(window as any).AdMobBridge.postMessage('hideBanner')
        } catch {}
      }
    }

    // Web: AdSense (evita push sem client/slot — padrão AdSense e build sem env)
    if (!hasAdsenseBannerUnit(placement)) return
    if (pushed.current) return
    pushed.current = true
    try {
      const ads = ((window as any).adsbygoogle = (window as any).adsbygoogle || [])
      ads.requestNonPersonalizedAds = canLoadPersonalizedAds ? 0 : 1
      ads.push({})
    } catch {}
  }, [canLoadAds, canLoadPersonalizedAds, isPro, placement, nativeHost])

  if (isPro || !canLoadAds) return null

  if (nativeHost === 'pending') {
    return (
      <div className="flex flex-col items-center gap-1" aria-hidden="true">
        {showLabel && (
          <span className="text-[10px] uppercase tracking-wider text-white/30">
            {messages.exercicio.publicidade}
          </span>
        )}
        <div style={{ height: 50 }} />
      </div>
    )
  }

  // Flutter: banner é renderizado nativamente, exibe espaço reservado
  if (nativeHost === 'native') {
    if (bannerNativeFailed) return null
    return (
      <div className="flex flex-col items-center gap-1">
        {showLabel && (
          <span className="text-[10px] uppercase tracking-wider text-white/30">
            {messages.exercicio.publicidade}
          </span>
        )}
        <div style={{ height: 50 }} aria-hidden="true" />
      </div>
    )
  }

  if (!hasAdsenseBannerUnit(placement)) {
    // Sem unidade AdSense configurada: reserva o espaço visual para evitar
    // layout shift e garante que o banner apareça mesmo sem env vars no build.
    if (!showLabel) return null
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-wider text-white/30">
          {messages.exercicio.publicidade}
        </span>
        <div style={{ height: 50 }} aria-hidden="true" />
      </div>
    )
  }

  const adClient = getAdsenseClientId()!
  const slotId = getAdsenseBannerSlotId(placement)!

  return (
    <div className="my-4 flex flex-col items-center gap-1" ref={ref}>
      {showLabel && (
        <span className="text-[10px] uppercase tracking-wider text-white/30">
          {messages.exercicio.publicidade}
        </span>
      )}
      <div className="flex justify-center w-full" style={{ minHeight: 50 }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', maxWidth: 320, height: 50 }}
          data-ad-client={adClient}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
          data-npa={canLoadPersonalizedAds ? undefined : '1'}
        />
      </div>
    </div>
  )
}
