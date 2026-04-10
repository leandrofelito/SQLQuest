'use client'
import { useEffect, useRef } from 'react'
import { useUser } from '@/hooks/useUser'

function isFlutterApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).AdMobBridge
}

export function AdBanner() {
  const { isPro } = useUser()
  const ref = useRef<HTMLDivElement>(null)
  const pushed = useRef(false)
  const flutter = useRef(isFlutterApp())

  useEffect(() => {
    if (isPro) return

    if (flutter.current) {
      // Solicita banner nativo ao AdMob via bridge
      try {
        ;(window as any).AdMobBridge.postMessage('showBanner')
      } catch {}
      return () => {
        try {
          ;(window as any).AdMobBridge.postMessage('hideBanner')
        } catch {}
      }
    }

    // Web: AdSense
    if (pushed.current) return
    pushed.current = true
    try {
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    } catch {}
  }, [isPro])

  if (isPro) return null

  // Flutter: banner é renderizado nativamente, exibe espaço reservado
  if (flutter.current) {
    return <div style={{ height: 50 }} aria-hidden="true" />
  }

  return (
    <div className="my-4 flex justify-center" ref={ref}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: 320, height: 50 }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
