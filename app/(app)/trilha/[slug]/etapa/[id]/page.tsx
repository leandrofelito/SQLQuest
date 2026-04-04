'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { TelaIntro } from '@/components/microlicao/TelaIntro'
import { TelaTexto } from '@/components/microlicao/TelaTexto'
import { TelaResumo } from '@/components/microlicao/TelaResumo'
import { TelaExercicio } from '@/components/microlicao/TelaExercicio'
import { TelaConclusao } from '@/components/microlicao/TelaConclusao'
import { AnuncioVideo } from '@/components/anuncio/AnuncioVideo'
import { useUser } from '@/hooks/useUser'
import type { ConteudoIntro, ConteudoTexto, ConteudoResumo, ConteudoExercicio, ConteudoConclusao } from '@/types'

interface EtapaDB {
  id: string
  trilhaId: string
  ordem: number
  tipo: string
  titulo: string
  conteudo: any
  xpReward: number
  temAnuncio: boolean
}

interface TrilhaBasica {
  id: string
  slug: string
  titulo: string
  totalEtapas: number
}

export default function EtapaPage() {
  const { slug, id } = useParams() as { slug: string; id: string }
  const router = useRouter()
  const { isPro } = useUser()

  const [etapa, setEtapa] = useState<EtapaDB | null>(null)
  const [trilha, setTrilha] = useState<TrilhaBasica | null>(null)
  const [todasEtapas, setTodasEtapas] = useState<{ id: string; ordem: number }[]>([])
  const [showAnuncio, setShowAnuncio] = useState(false)
  const [xpGanho, setXpGanho] = useState(0)
  const [showXpPop, setShowXpPop] = useState(false)
  const [trilhaConcluida, setTrilhaConcluida] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [etapaRes, trilhasRes, progressoRes] = await Promise.all([
        fetch(`/api/etapa?id=${id}`),
        fetch('/api/trilhas'),
        fetch('/api/progresso'),
      ])

      const etapaData: EtapaDB = await etapaRes.json()
      const trilhas = await trilhasRes.json()
      const progressos = await progressoRes.json()

      const t = trilhas.find((tr: any) => tr.slug === slug)
      if (!t || !etapaData?.id) { router.push(`/trilha/${slug}`); return }

      setEtapa(etapaData)
      setTrilha(t)
      setTodasEtapas(t.etapas ?? [])

      // Verifica se trilha ficará concluída após esta etapa
      const etapasConcluidasIds = new Set(progressos.map((p: any) => p.etapaId))
      etapasConcluidasIds.add(id) // assume que vai concluir
      const totalEtapas = (t.etapas ?? []).length
      setTrilhaConcluida(etapasConcluidasIds.size >= totalEtapas)

      setLoading(false)

      // Mostra anúncio se necessário
      if (etapaData.temAnuncio && !isPro) {
        setShowAnuncio(true)
      }
    }
    load()
  }, [id, slug, router, isPro])

  async function salvarProgresso(xp: number, usouDica: boolean, tentativas: number, primeiraTentativa: boolean) {
    if (!etapa || !trilha) return
    const res = await fetch('/api/progresso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trilhaId: trilha.id,
        etapaId: etapa.id,
        usouDica,
        tentativas,
        primeiraTentativa,
      }),
    })
    const data = await res.json()
    if (!data.jaFeito && data.xpGanho > 0) {
      setXpGanho(data.xpGanho)
      setShowXpPop(true)
      setTimeout(() => setShowXpPop(false), 2500)
    }
    return data
  }

  function proximaEtapa() {
    if (!etapa || !trilha) return
    const ordenadas = [...todasEtapas].sort((a, b) => a.ordem - b.ordem)
    const idx = ordenadas.findIndex(e => e.id === etapa.id)
    const proxima = ordenadas[idx + 1]
    if (proxima) {
      router.push(`/trilha/${slug}/etapa/${proxima.id}`)
    } else {
      router.push(`/trilha/${slug}`)
    }
  }

  if (loading || !etapa || !trilha) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/30">Carregando etapa...</div>
      </div>
    )
  }

  const ordenadas = [...todasEtapas].sort((a, b) => a.ordem - b.ordem)
  const idx = ordenadas.findIndex(e => e.id === etapa.id)
  const progressoPct = ((idx + 1) / ordenadas.length) * 100

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col">
      {/* Barra de progresso */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <div className="h-1 bg-[#1e2028]">
          <div
            className="h-full bg-[#8b5cf6] transition-all duration-500"
            style={{ width: `${progressoPct}%` }}
          />
        </div>
        <div className="bg-[#080a0f]/80 backdrop-blur-sm flex items-center justify-between px-4 py-3">
          <button onClick={() => router.push(`/trilha/${slug}`)} className="text-white/40 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-white/40 text-sm">{idx + 1} / {ordenadas.length}</span>
          <div className="w-5" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pt-16">
        <AnimatePresence mode="wait">
          {etapa.tipo === 'intro' && (
            <motion.div key="intro" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100vh-4rem)] flex flex-col">
                <TelaIntro
                  titulo={etapa.titulo}
                  conteudo={etapa.conteudo as ConteudoIntro}
                  onContinuar={proximaEtapa}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'texto' && (
            <motion.div key="texto" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100vh-4rem)] flex flex-col">
                <TelaTexto
                  titulo={etapa.titulo}
                  conteudo={etapa.conteudo as ConteudoTexto}
                  onContinuar={proximaEtapa}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'resumo' && (
            <motion.div key="resumo" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100vh-4rem)] flex flex-col">
                <TelaResumo
                  titulo={etapa.titulo}
                  conteudo={etapa.conteudo as ConteudoResumo}
                  onContinuar={proximaEtapa}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'exercicio' && (
            <motion.div key="exercicio" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100vh-4rem)] flex flex-col overflow-y-auto">
                <TelaExercicio
                  titulo={etapa.titulo}
                  conteudo={etapa.conteudo as ConteudoExercicio}
                  xpReward={etapa.xpReward}
                  onConcluido={async (xp, usouDica, tentativas, primeiraTentativa) => {
                    await salvarProgresso(xp, usouDica, tentativas, primeiraTentativa)
                    proximaEtapa()
                  }}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'conclusao' && (
            <motion.div key="conclusao" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100vh-4rem)] flex flex-col">
                <TelaConclusao
                  conteudo={etapa.conteudo as ConteudoConclusao}
                  xpGanho={xpGanho}
                  trilhaSlug={slug}
                  trilhaId={trilha.id}
                  trilhaConcluida={trilhaConcluida}
                  isPro={isPro}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* XP Pop */}
      <AnimatePresence>
        {showXpPop && (
          <motion.div
            className="fixed top-20 right-4 z-50 bg-amber-500 text-black font-bold text-sm px-4 py-2 rounded-full shadow-lg"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            +{xpGanho} XP 🏆
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anúncio */}
      {showAnuncio && (
        <AnuncioVideo isPro={isPro} onConcluido={() => setShowAnuncio(false)} />
      )}
    </div>
  )
}
