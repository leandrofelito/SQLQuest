'use client'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { TelaIntro } from '@/features/learning/components/screens/TelaIntro'
import { TelaTexto } from '@/features/learning/components/screens/TelaTexto'
import { TelaResumo } from '@/features/learning/components/screens/TelaResumo'
import { TelaExercicio } from '@/features/learning/components/screens/TelaExercicio'
import { TelaConclusao } from '@/features/learning/components/screens/TelaConclusao'
import { AnuncioVideo } from '@/features/ads/components/AnuncioVideo'
import { LevelUpModal } from '@/features/gamification/components/LevelUpModal'
import { ConquistaToast } from '@/features/gamification/components/ConquistaToast'
import { useSession } from 'next-auth/react'
import { useUser } from '@/hooks/useUser'
import { useLocale } from '@/context/LocaleContext'
import { useAppData } from '@/context/AppDataContext'
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
  const { update: updateSession } = useSession()
  const { messages, locale } = useLocale()
  const { loadTrilhas, loadProgresso, addProgressoOptimistic, loadEtapa, prefetchEtapa } = useAppData()

  const [etapa, setEtapa] = useState<EtapaDB | null>(null)
  const [trilha, setTrilha] = useState<TrilhaBasica | null>(null)
  const [todasEtapas, setTodasEtapas] = useState<{ id: string; ordem: number }[]>([])
  const [showAnuncio, setShowAnuncio] = useState(false)
  const [xpGanho, setXpGanho] = useState(0)
  const [estrelasGanhas, setEstrelasGanhas] = useState(0)
  const [showXpPop, setShowXpPop] = useState(false)
  const [novaConquistaRanking, setNovaConquistaRanking] = useState<string | null>(null)
  const [levelUp, setLevelUp] = useState<{ anterior: number; atual: number } | null>(null)
  const [conquistasFila, setConquistasFila] = useState<Array<{ id: string; emoji: string; nome: string }>>([])
  const conquistasPendentesRef = useRef<Array<{ id: string; emoji: string; nome: string }>>([])
  /** Level up após esvaziar a fila de toasts de conquista (evita modal cobrir o toast). */
  const deferredLevelUpRef = useRef<{ anterior: number; atual: number } | null>(null)
  /** Navegação/anúncio só depois que o usuário viu todas as conquistas da fila. */
  const proximaEtapaAposConquistasRef = useRef<(() => void) | null>(null)
  const exibirProximaConquista = useCallback(() => {
    conquistasPendentesRef.current.shift()
    const rest = [...conquistasPendentesRef.current]
    setConquistasFila(rest)
    if (rest.length === 0) {
      if (deferredLevelUpRef.current) {
        setLevelUp(deferredLevelUpRef.current)
        deferredLevelUpRef.current = null
      } else if (proximaEtapaAposConquistasRef.current) {
        const fn = proximaEtapaAposConquistasRef.current
        proximaEtapaAposConquistasRef.current = null
        fn()
      }
    }
  }, [])
  const [trilhaConcluida, setTrilhaConcluida] = useState(false)
  const [loading, setLoading] = useState(true)
  const [erroConexao, setErroConexao] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const proximaEtapaAposLevelUpRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    async function load() {
      setErroConexao(false)
      setLoading(true)
      try {
        // All three use cache — only hits network if not yet cached
        const [etapaData, trilhas, progressos] = await Promise.all([
          loadEtapa(id, locale),
          loadTrilhas(locale),
          loadProgresso(),
        ])

        if (!etapaData?.id) throw new Error('server')

        const t = trilhas.find((tr: any) => tr.slug === slug)
        if (!t) { router.push(`/trilha/${slug}`); return }

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

        // Prefetch próximas 2 etapas silenciosamente
        if (idxAtual >= 0) {
          const proximas = ordenadas.slice(idxAtual + 1, idxAtual + 3)
          proximas.forEach(e => prefetchEtapa(e.id, locale))
        }

        // Trilha concluída quando todas as etapas (teoria + exercícios) forem concluídas
        const todasEtapaIds = new Set((t.etapas ?? []).map((e: any) => e.id))
        const etapasConcluidasIds = new Set(progressos.map((p: any) => p.etapaId))
        etapasConcluidasIds.add(id) // assume que esta etapa será concluída
        const concluidasTotal = [...todasEtapaIds].filter(eid => etapasConcluidasIds.has(eid)).length
        setTrilhaConcluida(todasEtapaIds.size > 0 && concluidasTotal >= todasEtapaIds.size)

        setLoading(false)
      } catch {
        setLoading(false)
        setErroConexao(true)
      }
    }
    load()
  }, [id, slug, router, isPro, retryCount])

  // Marca conclusao como visitada automaticamente ao renderizar (não tem botão Continuar próprio)
  useEffect(() => {
    if (etapa?.tipo === 'conclusao' && trilha) {
      // Atualiza cache local para que o percentual da trilha reflita 100%
      addProgressoOptimistic(etapa.id, trilha.id)
      fetch('/api/marcar-visitada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trilhaId: trilha.id, etapaId: etapa.id }),
      })
      // Garante que a sessão reflita o XP acumulado na trilha
      updateSession()
    }
  }, [etapa?.id, etapa?.tipo, trilha?.id, addProgressoOptimistic, updateSession])

  async function marcarVisitada() {
    if (!etapa || !trilha) return
    // Atualiza o cache local imediatamente para que o guard da próxima etapa passe
    addProgressoOptimistic(etapa.id, trilha.id)
    // Registra etapas de leitura/intro/resumo/conclusao como concluídas para desbloquear a próxima
    await fetch('/api/marcar-visitada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trilhaId: trilha.id, etapaId: etapa.id }),
    })
  }

  async function salvarProgresso(estrelas: number, dicasUsadas: number, tentativas: number, token: string) {
    if (!etapa || !trilha) return null

    // Optimistic update — atualiza o cache antes da resposta do servidor
    addProgressoOptimistic(etapa.id, trilha.id, 0, estrelas)

    const res = await fetch('/api/progresso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trilhaId: trilha.id,
        etapaId: etapa.id,
        token,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.xpGanho > 0) {
      setXpGanho(data.xpGanho)
      setEstrelasGanhas(data.estrelas ?? estrelas)
      setShowXpPop(true)
      setTimeout(() => setShowXpPop(false), 3000)
      updateSession()
    }
    if (data.novasConquistasRanking?.length > 0) {
      setNovaConquistaRanking(data.novasConquistasRanking[0])
      setTimeout(() => setNovaConquistaRanking(null), 8000)
    }
    if (data.nivelAtual > data.nivelAnterior) {
      if (data.novasConquistas?.length > 0) {
        deferredLevelUpRef.current = { anterior: data.nivelAnterior, atual: data.nivelAtual }
      } else {
        setLevelUp({ anterior: data.nivelAnterior, atual: data.nivelAtual })
      }
    }
    if (data.novasConquistas?.length > 0) {
      conquistasPendentesRef.current = [...data.novasConquistas]
      setConquistasFila([...data.novasConquistas])
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

  if (erroConexao) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-5xl">📡</div>
        <div>
          <p className="text-white font-semibold text-lg mb-1">{messages.etapa.semConexao}</p>
          <p className="text-white/40 text-sm">{messages.etapa.semConexaoDesc}</p>
        </div>
        <button
          onClick={() => { setErroConexao(false); setLoading(true); setRetryCount(c => c + 1) }}
          className="px-6 py-2 rounded-xl bg-[#8b5cf6] text-white font-semibold text-sm hover:bg-[#7c3aed] transition-colors"
        >
          {messages.etapa.tentarNovamente}
        </button>
        <button
          onClick={() => router.push(`/trilha/${slug}`)}
          className="text-white/30 text-sm hover:text-white/60 transition-colors"
        >
          {messages.etapa.voltarTrilha}
        </button>
      </div>
    )
  }

  if (loading || !etapa || !trilha) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/30">{messages.etapa.loading}</div>
      </div>
    )
  }

  const ordenadas = [...todasEtapas].sort((a, b) => a.ordem - b.ordem)
  const idx = ordenadas.findIndex(e => e.id === etapa.id)
  const progressoPct = ((idx + 1) / ordenadas.length) * 100
  const ehUltimaEtapaConclusao =
    etapa.tipo === 'conclusao' &&
    ordenadas.length > 0 &&
    ordenadas[ordenadas.length - 1].id === etapa.id

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
          {idx > 0 ? (
            <button
              onClick={() => router.push(`/trilha/${slug}/etapa/${ordenadas[idx - 1].id}`)}
              className="text-white/40 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {messages.etapa.voltar}
            </button>
          ) : (
            <div className="w-14" />
          )}
          <span className="text-white/40 text-sm">{idx + 1} / {ordenadas.length}</span>
          <button onClick={() => router.push(`/trilha/${slug}`)} className="text-white/40 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                    const seguirEmFrente = () => {
                      if (!isPro) {
                        setShowAnuncio(true)
                        return
                      }
                      proximaEtapa()
                    }

                    const data = await salvarProgresso(estrelas, dicasUsadas, tentativas, token)

                    if (data === null) {
                      // Save HMAC falhou (token inválido/rede). Marca a etapa com 0 XP para
                      // que o guard da próxima etapa passe, depois exibe o anúncio normalmente.
                      if (etapa && trilha) {
                        await fetch('/api/marcar-visitada', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ trilhaId: trilha.id, etapaId: etapa.id, fallback: true }),
                        }).catch(() => {})
                      }
                      seguirEmFrente()
                      return
                    }

                    if (data?.nivelAtual > data?.nivelAnterior) {
                      proximaEtapaAposLevelUpRef.current = seguirEmFrente
                    } else if ((data?.novasConquistas?.length ?? 0) > 0) {
                      proximaEtapaAposConquistasRef.current = seguirEmFrente
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
              <div className="h-[calc(100dvh-4rem)] flex flex-col overflow-hidden">
                <TelaConclusao
                  conteudo={etapa.conteudo as ConteudoConclusao}
                  xpGanho={xpGanho}
                  trilhaSlug={slug}
                  trilhaId={trilha.id}
                  trilhaConcluida={trilhaConcluida || ehUltimaEtapaConclusao}
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

      {/* Level Up Modal */}
      <AnimatePresence>
        {levelUp !== null && (
          <LevelUpModal
            nivel={levelUp.atual}
            onContinuar={() => {
              setLevelUp(null)
              proximaEtapaAposLevelUpRef.current?.()
              proximaEtapaAposLevelUpRef.current = null
            }}
          />
        )}
      </AnimatePresence>

      {/* Conquista desbloqueada — exibe uma de cada vez */}
      <AnimatePresence>
        {conquistasFila.length > 0 && levelUp === null && (
          <ConquistaToast
            key={conquistasFila[0].id}
            emoji={conquistasFila[0].emoji}
            nome={conquistasFila[0].nome}
            onDismiss={exibirProximaConquista}
          />
        )}
      </AnimatePresence>

      {/* Anúncio intersticial (após cada exercício concluído) — navega ao concluir OU ao fechar */}
      {showAnuncio && (
        <AnuncioVideo
          isPro={isPro}
          adType="interstitial"
          onConcluido={() => { setShowAnuncio(false); proximaEtapa() }}
          onFechar={() => { setShowAnuncio(false); proximaEtapa() }}
        />
      )}
    </div>
  )
}
