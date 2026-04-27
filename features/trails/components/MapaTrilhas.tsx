'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CardTrilha } from './CardTrilha'
import { BannerPro } from '@/features/ads/components/BannerPro'
import { AnuncioVideo } from '@/features/ads/components/AnuncioVideo'
import { useUser } from '@/hooks/useUser'
import { useAppData } from '@/context/AppDataContext'

interface TrilhaData {
  id: string
  slug: string
  titulo: string
  icone: string
  ordem: number
  totalEtapas: number
  percentualConcluido?: number
  etapasConcluidas?: number
  desbloqueadaPorAnuncio?: boolean
  ultimaTrilha?: boolean
}

interface MapaTrilhasProps {
  trilhas: TrilhaData[]
}

/**
 * Máquina de estado para o fluxo de desbloqueio via anúncios.
 *
 * idle → confirming → watching_1 → between_ads → watching_2 → unlocking → success
 *                         ↓ (fechar/falhar)          ↓ (fechar/falhar)
 *                    ad_dismissed               ad_dismissed
 *                         ↓ (tentar de novo)
 *                      confirming
 */
type FlowPhase =
  | 'idle'
  | 'confirming'
  | 'watching_1'
  | 'between_ads'
  | 'watching_2'
  | 'unlocking'
  | 'success'
  | 'ad_dismissed'
  | 'unlock_error'

export function MapaTrilhas({ trilhas }: MapaTrilhasProps) {
  const { isPro } = useUser()
  const { marcarTrilhaDesbloqueadaPorAnuncio } = useAppData()
  const router = useRouter()

  const [phase, setPhase] = useState<FlowPhase>('idle')
  const [trilhaAlvo, setTrilhaAlvo] = useState<TrilhaData | null>(null)
  const [desbloqueadasSessao, setDesbloqueadasSessao] = useState<Set<string>>(new Set())
  const [unlockError, setUnlockError] = useState<string | null>(null)

  // Controla qual dos 2 anúncios está sendo exibido (para chave única no React)
  const [adIndex, setAdIndex] = useState<1 | 2>(1)

  const betweenAdsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (betweenAdsTimerRef.current !== null) clearTimeout(betweenAdsTimerRef.current)
    }
  }, [])

  // ── Handlers de navegação de fase ─────────────────────────────────────────

  const handleBloqueadaClick = useCallback((trilha: TrilhaData) => {
    setTrilhaAlvo(trilha)
    setUnlockError(null)
    setAdIndex(1)
    setPhase('confirming')
  }, [])

  const handleConfirmarAssistir = useCallback(() => {
    setAdIndex(1)
    setPhase('watching_1')
  }, [])

  const handleRejeitarOuFechar = useCallback(() => {
    setTrilhaAlvo(null)
    setUnlockError(null)
    setAdIndex(1)
    setPhase('idle')
  }, [])

  // Chamado quando um anúncio é concluído com sucesso (recompensa ganha)
  const handleAdConcluido = useCallback(() => {
    setPhase(prev => {
      if (prev === 'watching_1') return 'between_ads'
      if (prev === 'watching_2') return 'unlocking'
      return prev
    })
  }, [])

  // Chamado quando o usuário fecha o anúncio sem completá-lo, ou quando falha
  const handleAdFechado = useCallback(() => {
    if (betweenAdsTimerRef.current !== null) {
      clearTimeout(betweenAdsTimerRef.current)
      betweenAdsTimerRef.current = null
    }
    setPhase('ad_dismissed')
  }, [])

  // Transição automática de between_ads → watching_2
  useEffect(() => {
    if (phase !== 'between_ads') return
    betweenAdsTimerRef.current = setTimeout(() => {
      betweenAdsTimerRef.current = null
      setAdIndex(2)
      setPhase('watching_2')
    }, 1200)
    return () => {
      if (betweenAdsTimerRef.current !== null) {
        clearTimeout(betweenAdsTimerRef.current)
        betweenAdsTimerRef.current = null
      }
    }
  }, [phase])

  // Dispara o desbloqueio quando entra na fase unlocking
  useEffect(() => {
    if (phase !== 'unlocking') return
    const trilha = trilhaAlvo
    if (!trilha) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/desbloquear-trilha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trilhaSlug: trilha.slug }),
        })
        if (!res.ok) throw new Error('Falha ao persistir desbloqueio')
        if (cancelled) return
        setDesbloqueadasSessao(prev => new Set(prev).add(trilha.slug))
        marcarTrilhaDesbloqueadaPorAnuncio(trilha.slug)
        setPhase('success')
      } catch {
        if (cancelled) return
        setUnlockError('Não foi possível confirmar o desbloqueio. Tente novamente.')
        setPhase('unlock_error')
      }
    })()

    return () => { cancelled = true }
  }, [phase, trilhaAlvo, marcarTrilhaDesbloqueadaPorAnuncio])

  const tentarDesbloqueioNovamente = useCallback(() => {
    setUnlockError(null)
    setPhase('unlocking')
  }, [])

  const entrarNaTrilha = useCallback(() => {
    if (trilhaAlvo) router.push(`/trilha/${trilhaAlvo.slug}`)
  }, [trilhaAlvo, router])

  // ── Renderização ──────────────────────────────────────────────────────────

  return (
    <>
      {/* Mobile: grade 2 colunas */}
      <div className="md:hidden grid grid-cols-2 gap-4 py-4 px-4">
        {trilhas.map((trilha, i) => {
          const desbloqueadaNaturalmente =
            i === 0 ||
            (trilhas[i - 1]?.percentualConcluido ?? 0) === 100 ||
            trilha.desbloqueadaPorAnuncio ||
            desbloqueadasSessao.has(trilha.slug)
          const desbloqueada = isPro || desbloqueadaNaturalmente
          const liberadaPorPro = isPro && !desbloqueadaNaturalmente && (trilha.percentualConcluido ?? 0) === 0
          return (
            <CardTrilha
              key={trilha.id}
              trilha={trilha}
              desbloqueada={desbloqueada}
              liberadaPorPro={liberadaPorPro}
              ultimaTrilha={trilha.ultimaTrilha}
              index={i}
              onBloqueadaClick={() => handleBloqueadaClick(trilha)}
              fullWidth
            />
          )
        })}
      </div>

      {/* Desktop: grade */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-4">
        {trilhas.map((trilha, i) => {
          const desbloqueadaNaturalmente =
            i === 0 ||
            (trilhas[i - 1]?.percentualConcluido ?? 0) === 100 ||
            trilha.desbloqueadaPorAnuncio ||
            desbloqueadasSessao.has(trilha.slug)
          const desbloqueada = isPro || desbloqueadaNaturalmente
          const liberadaPorPro = isPro && !desbloqueadaNaturalmente && (trilha.percentualConcluido ?? 0) === 0
          return (
            <CardTrilha
              key={trilha.id}
              trilha={trilha}
              desbloqueada={desbloqueada}
              liberadaPorPro={liberadaPorPro}
              ultimaTrilha={trilha.ultimaTrilha}
              index={i}
              onBloqueadaClick={() => handleBloqueadaClick(trilha)}
              fullWidth
            />
          )
        })}
      </div>

      {/* Confirmação: "Deseja assistir 2 anúncios?" */}
      <BannerPro
        open={phase === 'confirming'}
        onClose={handleRejeitarOuFechar}
        onRejeitar={handleRejeitarOuFechar}
        onAssistirAnuncio={handleConfirmarAssistir}
      />

      {/* Anúncio 1 */}
      {phase === 'watching_1' && (
        <AnuncioVideo
          key="trilha-ad-1"
          isPro={false}
          adType="rewarded"
          label="Anúncio 1 de 2"
          onConcluido={handleAdConcluido}
          onFechar={handleAdConcluido}
          onFalhou={handleAdFechado}
        />
      )}

      {/* Transição entre anúncios */}
      <AnimatePresence>
        {phase === 'between_ads' && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-4 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
            <p className="text-white/70 text-sm text-center">Anúncio 1 concluído! Preparando anúncio 2...</p>
            <p className="text-white/30 text-xs text-center">Aguarde um momento</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anúncio 2 */}
      {phase === 'watching_2' && (
        <AnuncioVideo
          key="trilha-ad-2"
          isPro={false}
          adType="rewarded"
          label="Anúncio 2 de 2"
          onConcluido={handleAdConcluido}
          onFechar={handleAdConcluido}
          onFalhou={handleAdFechado}
        />
      )}

      {/* Carregando desbloqueio */}
      <AnimatePresence>
        {phase === 'unlocking' && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-4 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
            <p className="text-white/70 text-sm text-center">Confirmando desbloqueio da trilha...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sucesso */}
      <AnimatePresence>
        {phase === 'success' && trilhaAlvo && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-3xl">{trilhaAlvo.icone}</span>
              <h2 className="text-white text-2xl font-bold">Trilha liberada!</h2>
              <p className="text-white/50 text-sm">
                <span className="text-white/80 font-semibold">{trilhaAlvo.titulo}</span> está disponível para você
              </p>
            </motion.div>

            <motion.button
              onClick={entrarNaTrilha}
              className="w-full max-w-xs py-4 rounded-xl bg-[#8b5cf6] text-white font-bold text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.97 }}
            >
              Começar trilha →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anúncio fechado antes de completar */}
      <AnimatePresence>
        {phase === 'ad_dismissed' && trilhaAlvo && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-3xl">{trilhaAlvo.icone}</span>
              <h2 className="text-white text-xl font-bold">Anúncio não disponível</h2>
              <p className="text-white/50 text-sm">
                Não foi possível carregar o anúncio agora. Tente novamente em alguns instantes.
              </p>
            </motion.div>

            <motion.div
              className="w-full max-w-xs flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => {
                  setAdIndex(1)
                  setPhase('confirming')
                }}
                className="w-full py-4 rounded-xl bg-[#8b5cf6] text-white font-bold text-base"
              >
                Tentar novamente
              </button>
              <button
                onClick={handleRejeitarOuFechar}
                className="w-full py-3 rounded-xl bg-white/5 text-white/60 font-medium"
              >
                Voltar ao mapa
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Erro ao persistir desbloqueio */}
      <AnimatePresence>
        {phase === 'unlock_error' && trilhaAlvo && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-white text-2xl font-bold">Falha ao liberar trilha</h2>
              <p className="text-white/60 text-sm">{unlockError ?? 'Não foi possível finalizar agora.'}</p>
            </motion.div>

            <motion.div
              className="w-full max-w-xs flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={tentarDesbloqueioNovamente}
                className="w-full py-4 rounded-xl bg-[#8b5cf6] text-white font-bold text-lg"
              >
                Tentar novamente
              </button>
              <button
                onClick={handleRejeitarOuFechar}
                className="w-full py-3 rounded-xl bg-white/5 text-white/70 font-medium"
              >
                Voltar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
