/**
 * AdSense no site (web). No app Flutter usa-se AdMob nativo (outro fluxo).
 * `NEXT_PUBLIC_*` são embutidas no build — defina em Vercel / .env.local para produção.
 */

function trimEnv(key: string): string | undefined {
  const v = process.env[key]?.trim()
  return v || undefined
}

/** Normaliza para o formato exigido em `data-ad-client` e no parâmetro `client` do script. */
export function normalizeAdsenseClientId(raw: string | undefined | null): string | null {
  if (!raw) return null
  const t = raw.trim()
  if (!t) return null
  if (t.startsWith('ca-pub-')) return t
  if (t.startsWith('pub-')) return `ca-${t}`
  if (/^\d+$/.test(t)) return `ca-pub-${t}`
  return null
}

export function getAdsenseClientId(): string | null {
  return normalizeAdsenseClientId(trimEnv('NEXT_PUBLIC_ADSENSE_ID'))
}

/** Script global do AdSense (uma vez por página). */
export function shouldLoadAdsenseScript(): boolean {
  if (trimEnv('NEXT_PUBLIC_ADSENSE_LOAD_SCRIPT') === 'false') return false
  return getAdsenseClientId() !== null
}

export function getAdsenseScriptSrc(): string | null {
  const client = getAdsenseClientId()
  if (!client) return null
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
}

/** Onde o banner de display é usado (Web); no Flutter o mesmo anúncio nativo atende todos). */
export type AdBannerPlacement = 'default' | 'estrelas'

/** Slot AdSense para banner; em `estrelas` usa slot dedicado se existir, senão o banner padrão. */
export function getAdsenseBannerSlotId(placement: AdBannerPlacement = 'default'): string | undefined {
  if (placement === 'estrelas') {
    const dedicated = trimEnv('NEXT_PUBLIC_ADSENSE_SLOT_BANNER_ESTRELAS')
    if (dedicated) return dedicated
  }
  return trimEnv('NEXT_PUBLIC_ADSENSE_SLOT')
}

export function hasAdsenseBannerUnit(placement: AdBannerPlacement = 'default'): boolean {
  return getAdsenseClientId() !== null && !!getAdsenseBannerSlotId(placement)
}

export function hasAdsenseModalUnit(): boolean {
  return getAdsenseClientId() !== null && !!trimEnv('NEXT_PUBLIC_ADSENSE_SLOT_TRILHA_MODAL')
}
