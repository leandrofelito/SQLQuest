'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { TelaIntro } from '@/components/microlicao/TelaIntro'
import { TelaTexto } from '@/components/microlicao/TelaTexto'
import { TelaResumo } from '@/components/microlicao/TelaResumo'
import { TelaExercicio } from '@/components/microlicao/TelaExercicio'
import { TelaConclusao } from '@/components/microlicao/TelaConclusao'
import { AnuncioVideo } from '@/components/anuncio/AnuncioVideo'
import { LevelUpToast } from '@/components/ui/LevelUpToast'
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
  const [estrelasGanhas, setEstrelasGanhas] = useState(0)
  const [showXpPop, setShowXpPop] = useState(false)
  const [novaConquistaRanking, setNovaConquistaRanking] = useState<string | null>(null)
  const [levelUp, setLevelUp] = useState<{ anterior: number; atual: number } | null>(null)
  const [trilhaConcluida, setTrilhaConcluida] = useState(false)
  const [loading, setLoading] = useState(true)
  const proximaEtapaAposLevelUpRef = useRef<(() => void) | null>(null)

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

      // Guard: bloqueia acesso direto via URL se a etapa anterior não foi concluída
      const ordenadas: { id: string; ordem: number }[] = [...(t.etapas ?? [])].sort(
        (a: any, b: any) => a.ordem - b.ordem
      )
      const idxAtual = ordenadas.findIndex((e) => e.id === id)
      if (idxAtual > 0) {
        const progressoIds = new Set(progressos.map((p: any) => p.etapaId))
        const etapaAnterior = ordenadas[idxAtual - 1]
        if (!progressoIds.has(etapaAnterior.id)) {
          router.push(`/trilha/${slug}`)
          return
        }
      }

      setEtapa(etapaData)
      setTrilha(t)
      setTodasEtapas(t.etapas ?? [])

      // Trilha concluída quando todos os exercícios forem feitos
      const exercicioIds = new Set((t.etapas ?? []).filter((e: any) => e.tipo === 'exercicio').map((e: any) => e.id))
      const etapasConcluidasIds = new Set(progressos.map((p: any) => p.etapaId))
      etapasConcluidasIds.add(id) // assume que esta etapa será concluída
      const totalExercicios = exercicioIds.size
      const concluidosExercicios = [...etapasConcluidasIds].filter(eid => exercicioIds.has(eid)).length
      setTrilhaConcluida(totalExercicios > 0 && concluidosExercicios >= totalExercicios)

      setLoading(false)
    }
    load()
  }, [id, slug, router, isPro])

  // Marca conclusao como visitada automaticamente ao renderizar (não tem botão Continuar próprio)
  useEffect(() => {
    if (etapa?.tipo === 'conclusao' && trilha) {
      fetch('/api/marcar-visitada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trilhaId: trilha.id, etapaId: etapa.id }),
      })
    }
  }, [etapa?.id, etapa?.tipo, trilha?.id])

  async function marcarVisitada() {
    if (!etapa || !trilha) return
    // Registra etapas de leitura/intro/resumo/conclusao como concluídas para desbloquear a próxima
    await fetch('/api/marcar-visitada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trilhaId: trilha.id, etapaId: etapa.id }),
    })
  }

  async function salvarProgresso(estrelas: number, dicasUsadas: number, tentativas: number, token: string) {
    if (!etapa || !trilha) return
    const res = await fetch('/api/progresso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trilhaId: trilha.id,
        etapaId: etapa.id,
        token,
      }),
    })
    const data = await res.json()
    if (data.xpGanho > 0) {
      setXpGanho(data.xpGanho)
      setEstrelasGanhas(data.estrelas ?? estrelas)
      setShowXpPop(true)
      setTimeout(() => setShowXpPop(false), 3000)
    }
    if (data.novasConquistasRanking?.length > 0) {
      setNovaConquistaRanking(data.novasConquistasRanking[0])
      setTimeout(() => setNovaConquistaRanking(null), 5000)
    }
    if (data.nivelAtual > data.nivelAnterior) {
      setLevelUp({ anterior: data.nivelAnterior, atual: data.nivelAtual })
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
        <div className="bg-[#080a0f]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => router.push(`/trilha/${slug}`)} className="text-white/40 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-white/40 text-sm">{idx + 1} / {ordenadas.length}</span>
          <div className="w-5" />
        </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pt-16 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {etapa.tipo === 'intro' && (
            <motion.div key="intro" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100dvh-4rem)] flex flex-col">
                <TelaIntro
                  titulo={etapa.titulo}
                  conteudo={etapa.conteudo as ConteudoIntro}
                  onContinuar={async () => { await marcarVisitada(); proximaEtapa() }}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'texto' && (
            <motion.div key="texto" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100dvh-4rem)] flex flex-col">
                <TelaTexto
                  titulo={etapa.titulo}
                  conteudo={etapa.conteudo as ConteudoTexto}
                  onContinuar={async () => { await marcarVisitada(); proximaEtapa() }}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'resumo' && (
            <motion.div key="resumo" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100dvh-4rem)] flex flex-col">
                <TelaResumo
                  titulo={etapa.titulo}
                  conteudo={etapa.conteudo as ConteudoResumo}
                  onContinuar={async () => { await marcarVisitada(); proximaEtapa() }}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'exercicio' && (
            <motion.div key="exercicio" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100dvh-4rem)] flex flex-col overflow-y-auto">
                <TelaExercicio
                  titulo={etapa.titulo}
                  etapaId={etapa.id}
                  conteudo={etapa.conteudo as ConteudoExercicio}
                  xpReward={etapa.xpReward}
                  isPro={isPro}
                  onConcluido={async (estrelas, dicasUsadas, tentativas, token) => {
                    const data = await salvarProgresso(estrelas, dicasUsadas, tentativas, token)

                    const seguirEmFrente = () => {
                      if (!isPro) {
                        const key = 'sq_exercicios_count'
                        const count = (parseInt(localStorage.getItem(key) ?? '0', 10) || 0) + 1
                        localStorage.setItem(key, String(count))
                        if (count % 3 === 0) {
                          setShowAnuncio(true)
                          return
                        }
                      }
                      proximaEtapa()
                    }

                    if (data?.nivelAtual > data?.nivelAnterior) {
                      proximaEtapaAposLevelUpRef.current = seguirEmFrente
                    } else {
                      seguirEmFrente()
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {etapa.tipo === 'conclusao' && (
            <motion.div key="conclusao" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-[calc(100dvh-4rem)] flex flex-col">
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
            className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-amber-500 text-black font-bold text-sm px-4 py-2 rounded-full shadow-lg"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{'★'.repeat(estrelasGanhas)}{'☆'.repeat(3 - estrelasGanhas)}</span>
            <span>+{xpGanho} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificação de conquista de ranking */}
      <AnimatePresence>
        {novaConquistaRanking && (
          <motion.div
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-yellow-400/40 bg-[#1a1a0a] px-5 py-3 shadow-xl"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-yellow-300 font-bold text-sm leading-tight">Nova conquista desbloqueada!</p>
              <p className="text-yellow-400/80 text-xs">{novaConquistaRanking}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Toast */}
      <AnimatePresence>
        {levelUp !== null && (
          <LevelUpToast
            nivelAnterior={levelUp.anterior}
            nivelAtual={levelUp.atual}
            onDismiss={() => {
              setLevelUp(null)
              proximaEtapaAposLevelUpRef.current?.()
              proximaEtapaAposLevelUpRef.current = null
            }}
          />
        )}
      </AnimatePresence>

      {/* Anúncio */}
      {showAnuncio && (
        <AnuncioVideo isPro={isPro} onConcluido={() => { setShowAnuncio(false); proximaEtapa() }} />
      )}
    </div>
  )
}
