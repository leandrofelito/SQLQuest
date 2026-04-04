'use client'
import { useEffect, useRef } from 'react'
import { useUser } from '@/hooks/useUser'

export function AdBanner() {
  const { isPro } = useUser()
  const ref = useRef<HTMLDivElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (isPro || pushed.current) return
    pushed.current = true
    try {
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    } catch {}
  }, [isPro])

  if (isPro) return null

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
