'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ListaEtapas } from '@/components/trilha/ListaEtapas'
import { CertPreview } from '@/components/certificado/CertPreview'
import { Progress } from '@/components/ui/Progress'

interface Etapa {
  id: string
  ordem: number
  tipo: string
  titulo: string
  xpReward: number
  temAnuncio: boolean
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

export default function TrilhaPage() {
  const { slug } = useParams() as { slug: string }
  const router = useRouter()
  const [trilha, setTrilha] = useState<TrilhaData | null>(null)
  const [cert, setCert] = useState<CertData | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [tab, setTab] = useState<'indice' | 'descricao'>('indice')

  useEffect(() => {
    async function load() {
      const [trilhasRes, progressoRes, sessionRes] = await Promise.all([
        fetch('/api/trilhas'),
        fetch('/api/progresso'),
        fetch('/api/auth/session'),
      ])
      const trilhas = await trilhasRes.json()
      const progressos = await progressoRes.json()
      const session = await sessionRes.json()

      const t = trilhas.find((tr: any) => tr.slug === slug)
      if (!t) { router.push('/home'); return }

      const etapasComStatus = t.etapas.map((e: Etapa) => ({
        ...e,
        concluida: progressos.some((p: any) => p.etapaId === e.id),
      }))

      const concluidas = etapasComStatus.filter((e: any) => e.concluida).length
      const pct = t.totalEtapas > 0 ? Math.round((concluidas / t.totalEtapas) * 100) : 0

      setTrilha({ ...t, etapas: etapasComStatus, percentualConcluido: pct, etapasConcluidas: concluidas })
      setIsPro(session?.user?.isPro ?? false)

      if (pct === 100 && session?.user?.isPro) {
        try {
          const certRes = await fetch(`/api/certificado?trilhaId=${t.id}`, { method: 'HEAD' })
          if (certRes.ok) setCert({ hash: 'found' })
        } catch {}
      }
    }
    load()
  }, [slug, router])

  if (!trilha) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/30">Carregando...</div>
      </div>
    )
  }

  const etapaAtualOrdem = trilha.etapas.find((e: any) => !e.concluida)?.ordem ?? trilha.totalEtapas

  return (
    <div className="min-h-screen bg-[#080a0f] pb-8">
      <Header showBack backHref="/home" title={trilha.titulo} />

      {/* Header visual da trilha */}
      <div className="px-4 pt-6 pb-4 text-center space-y-3">
        <div className="text-5xl">{trilha.icone}</div>
        <div>
          <h1 className="text-xl font-bold text-white">{trilha.titulo}</h1>
          <p className="text-white/40 text-sm mt-1">{trilha.etapasConcluidas}/{trilha.totalEtapas} etapas</p>
        </div>
        <div className="max-w-xs mx-auto">
          <Progress value={trilha.percentualConcluido} showLabel />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e2028] px-4 mb-2">
        {(['indice', 'descricao'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'text-white border-b-2 border-[#8b5cf6]' : 'text-white/40'
            }`}
          >
            {t === 'indice' ? 'Índice' : 'Descrição'}
          </button>
        ))}
      </div>

      {tab === 'indice' ? (
        <>
          <ListaEtapas
            trilhaSlug={slug}
            etapas={trilha.etapas}
            etapaAtualOrdem={etapaAtualOrdem}
          />
          <CertPreview
            trilha={trilha}
            isPro={isPro}
            concluida={trilha.percentualConcluido === 100}
            certificadoHash={cert?.hash}
          />
        </>
      ) : (
        <div className="px-4 py-4 space-y-3">
          <p className="text-white/70 leading-relaxed">{trilha.descricao}</p>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-white/30 text-xs">Etapas</p>
              <p className="text-white font-bold">{trilha.totalEtapas}</p>
            </div>
            <div className="text-center">
              <p className="text-white/30 text-xs">XP Total</p>
              <p className="text-[#a78bfa] font-bold">{trilha.xpTotal}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
