'use client'
import { useLayoutEffect, useState } from 'react'

export type NativeAdHost = 'pending' | 'native' | 'web'

/**
 * Detecta WebView Flutter com AdMobBridge sem usar useRef(isFlutter) na primeira pintura
 * (SSR/hidratação deixavam `false` para sempre e o fluxo caía no AdSense dentro do app).
 */
export function useNativeAdHost(): NativeAdHost {
  const [host, setHost] = useState<NativeAdHost>('pending')

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      setHost('web')
      return
    }
    const hasBridge = () => !!(window as any).AdMobBridge
    if (hasBridge()) {
      setHost('native')
      return
    }
    const looksLikeSqlQuestApp =
      document.documentElement.classList.contains('native-app') ||
      !!(window as any).__sqlquestNativeApp
    if (!looksLikeSqlQuestApp) {
      setHost('web')
      return
    }
    const poll = window.setInterval(() => {
      if (hasBridge()) {
        setHost('native')
        window.clearInterval(poll)
        window.clearTimeout(maxWait)
      }
    }, 40)
    const maxWait = window.setTimeout(() => {
      window.clearInterval(poll)
      setHost(hasBridge() ? 'native' : 'web')
    }, 4000)
    return () => {
      window.clearInterval(poll)
      window.clearTimeout(maxWait)
    }
  }, [])

  return host
}
