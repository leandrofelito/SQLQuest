'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ListaEtapas } from '@/features/trails/components/ListaEtapas'
import { CertPreview } from '@/features/certificates/components/CertPreview'
import { Progress } from '@/components/ui/Progress'
import { useLocale } from '@/context/LocaleContext'
import { useAppData, type TrilhaComProgresso } from '@/context/AppDataContext'

interface Etapa {
  id: string
  ordem: number
  tipo: string
  titulo: string
  xpReward: number
  temAnuncio: boolean
  concluida?: boolean
}

interface TrilhaData {
  id: string
  slug: string
  titulo: string
  descricao: string
  icone: string
  totalEtapas: number
  xpTotal: number
  etapas: Etapa[]
  percentualConcluido: number
  etapasConcluidas: number
  progressos: { etapaId: string }[]
}

interface CertData {
  hash: string
}

function buildTrilhaFromCacheEntry(t: TrilhaComProgresso, slug: string): TrilhaData | null {
  if (t.slug !== slug || !t.etapas) return null
  const progressoIds = new Set((t.progressos ?? []).map(p => p.etapaId))
  const etapasComStatus = t.etapas.map((e: Etapa) => ({
    ...e,
    concluida: progressoIds.has(e.id),
  }))
  const concluidas = t.etapas.filter((e: Etapa) => progressoIds.has(e.id)).length
  const pct =
    t.etapas.length > 0 ? Math.min(100, Math.round((concluidas / t.etapas.length) * 100)) : 0
  return {
    id: t.id,
    slug: t.slug,
    titulo: t.titulo,
    descricao: t.descricao,
    icone: t.icone,
    totalEtapas: t.totalEtapas,
    xpTotal: t.xpTotal,
    etapas: etapasComStatus,
    percentualConcluido: pct,
    etapasConcluidas: concluidas,
    progressos: (t.progressos ?? []).map(p => ({ etapaId: p.etapaId })),
  }
}

export default function TrilhaPage() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()
  const { messages, locale } = useLocale()
  const { getCachedTrilhas, trilhasRevision } = useAppData()
  const [trilha, setTrilha] = useState<TrilhaData | null>(null)
  const [cert, setCert] = useState<CertData | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [tab, setTab] = useState<'indice' | 'descricao'>('indice')
  const [revalidating, setRevalidating] = useState(false)

  const hydrateFromCache = useCallback(() => {
    const list = getCachedTrilhas()
    if (!list) return null
    const t = list.find((tr: TrilhaComProgresso) => tr.slug === slug)
    if (!t) return null
    return buildTrilhaFromCacheEntry(t, slug)
  }, [getCachedTrilhas, slug])

  useEffect(() => {
    const cached = hydrateFromCache()
    if (cached) {
      setTrilha(cached)
      setRevalidating(true)
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/trilha-dashboard?slug=${encodeURIComponent(slug)}&lang=${locale}`, { cache: 'no-store' })
        if (cancelled) return
        if (!res.ok) {
          if (res.status === 404) router.push('/home')
          return
        }
        const body = await res.json()
        const t = body.trilha
        if (!t?.etapas) {
          router.push('/home')
          return
        }
        const progressoIds = new Set((body.progressos ?? []).map((p: { etapaId: string }) => p.etapaId))
        const etapasComStatus = t.etapas.map((e: Etapa) => ({
          ...e,
          concluida: progressoIds.has(e.id),
        }))
        const concluidas = t.etapas.filter((e: Etapa) => progressoIds.has(e.id)).length
        const pct =
          t.etapas.length > 0 ? Math.min(100, Math.round((concluidas / t.etapas.length) * 100)) : 0

        setTrilha({
          id: t.id,
          slug: t.slug,
          titulo: t.titulo,
          descricao: t.descricao,
          icone: t.icone,
          totalEtapas: t.totalEtapas,
          xpTotal: t.xpTotal,
          etapas: etapasComStatus,
          percentualConcluido: pct,
          etapasConcluidas: concluidas,
          progressos: (t.progressos ?? []).map((p: { etapaId: string }) => ({ etapaId: p.etapaId })),
        })
        setIsPro(body.isPro ?? false)
        setCert(body.cert?.hash ? { hash: body.cert.hash } : null)
      } finally {
        if (!cancelled) setRevalidating(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slug, locale, router, hydrateFromCache, trilhasRevision])

  if (!trilha) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/30">{messages.trilha.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080a0f] pb-8">
      <Header showBack backHref="/home" title={trilha.titulo} />

      {revalidating && (
        <div className="max-w-3xl mx-auto px-4 pt-1">
          <p className="text-center text-[11px] text-white/35 tracking-wide">Sincronizando…</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="px-4 pt-6 pb-4 text-center space-y-3">
          <div className="text-5xl">{trilha.icone}</div>
          <div>
            <h1 className="text-xl font-bold text-white">{trilha.titulo}</h1>
            <p className="text-white/40 text-sm mt-1">
              {trilha.etapasConcluidas}/{trilha.totalEtapas} {messages.trilha.etapas}
            </p>
          </div>
          <div className="max-w-xs mx-auto">
            <Progress value={trilha.percentualConcluido} showLabel />
          </div>
        </div>

        {trilha.percentualConcluido === 100 && (
          <CertPreview
            trilha={trilha}
            isPro={isPro}
            concluida
            certificadoHash={cert?.hash}
          />
        )}

        <div className="flex border-b border-[#1e2028] px-4 mb-2">
          {(['indice', 'descricao'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'text-white border-b-2 border-[#8b5cf6]' : 'text-white/40'
              }`}
            >
              {t === 'indice' ? messages.trilha.indice : messages.trilha.descricao}
            </button>
          ))}
        </div>

        {tab === 'indice' ? (
          <ListaEtapas trilhaSlug={slug} etapas={trilha.etapas} />
        ) : (
          <div className="px-4 py-4 space-y-3">
            <p className="text-white/70 leading-relaxed">{trilha.descricao}</p>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-white/30 text-xs">{messages.trilha.etapas}</p>
                <p className="text-white font-bold">{trilha.totalEtapas}</p>
              </div>
              <div className="text-center">
                <p className="text-white/30 text-xs">{messages.trilha.xpTotal}</p>
                <p className="text-[#a78bfa] font-bold">{trilha.xpTotal}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
