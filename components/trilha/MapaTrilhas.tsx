'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CardTrilha } from './CardTrilha'
import { BannerPro } from '@/components/anuncio/BannerPro'
import { AnuncioVideo } from '@/components/anuncio/AnuncioVideo'
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

type FluxoState = 'idle' | 'banner' | 'ad1' | 'transicao_ads' | 'ad2' | 'persistindo' | 'sucesso' | 'erro'

export function MapaTrilhas({ trilhas }: MapaTrilhasProps) {
  const { isPro } = useUser()
  const { marcarTrilhaDesbloqueadaPorAnuncio } = useAppData()
  const router = useRouter()
  const [fluxo, setFluxo] = useState<FluxoState>('idle')
  const [trilhaAlvo, setTrilhaAlvo] = useState<TrilhaData | null>(null)
  const [desbloqueadasSessao, setDesbloqueadasSessao] = useState<Set<string>>(new Set())
  const [erroDesbloqueio, setErroDesbloqueio] = useState<string | null>(null)
  const desbloqueioSegundoJaFeito = useRef(false)
  const desbloqueioPrimeiroJaFeito = useRef(false)
  const attemptCounterRef = useRef(0)
  const attemptIdAtivoRef = useRef<number | null>(null)
  const trilhaAlvoRef = useRef<TrilhaData | null>(null)
  const transicaoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function novaTentativa(): number {
    if (transicaoTimeoutRef.current !== null) {
      clearTimeout(transicaoTimeoutRef.current)
      transicaoTimeoutRef.current = null
    }
    attemptCounterRef.current += 1
    const id = attemptCounterRef.current
    attemptIdAtivoRef.current = id
    desbloqueioPrimeiroJaFeito.current = false
    desbloqueioSegundoJaFeito.current = false
    setErroDesbloqueio(null)
    return id
  }

  function tentativaAtivaEh(attemptId: number): boolean {
    return attemptIdAtivoRef.current === attemptId
  }

  async function persistirDesbloqueio(trilha: TrilhaData): Promise<boolean> {
    const res = await fetch('/api/desbloquear-trilha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trilhaSlug: trilha.slug }),
    })
    if (!res.ok) {
      throw new Error('Falha ao persistir desbloqueio')
    }
    return true
  }

  function handleBloqueadaClick(trilha: TrilhaData) {
    trilhaAlvoRef.current = trilha
    setTrilhaAlvo(trilha)
    novaTentativa()
    setFluxo('banner')
  }

  function iniciarAnuncios() {
    const attemptId = novaTentativa()
    // Fecha o banner primeiro para evitar sobreposição com o anúncio
    setFluxo('idle')
    setTimeout(() => {
      if (!tentativaAtivaEh(attemptId)) return
      setFluxo('ad1')
    }, 380)
  }

  function primeiroAnuncioConcluido(attemptId: number) {
    if (!tentativaAtivaEh(attemptId)) return
    if (desbloqueioPrimeiroJaFeito.current) return
    desbloqueioPrimeiroJaFeito.current = true
    // Exibe overlay de transição imediatamente para bloquear interação e sinalizar progresso.
    // O timeout dá tempo ao AdMob de dar dismiss, pré-carregar o 2º rewarded e o WebView trocar de overlay.
    setFluxo('transicao_ads')
    transicaoTimeoutRef.current = setTimeout(() => {
      transicaoTimeoutRef.current = null
      if (!tentativaAtivaEh(attemptId)) return
      setFluxo('ad2')
    }, 1200)
  }

  /** Fechar/sair sem recompensa não avança nem libera; volta ao banner para tentar de novo. */
  function abortarDesbloqueioPorAnuncios(attemptId: number) {
    if (!tentativaAtivaEh(attemptId)) return
    if (transicaoTimeoutRef.current !== null) {
      clearTimeout(transicaoTimeoutRef.current)
      transicaoTimeoutRef.current = null
    }
    attemptIdAtivoRef.current = null
    setFluxo('banner')
  }

  async function segundoAnuncioConcluido(attemptId: number) {
    if (!tentativaAtivaEh(attemptId)) return
    const trilha = trilhaAlvoRef.current
    if (!trilha) return
    if (desbloqueioSegundoJaFeito.current) return
    desbloqueioSegundoJaFeito.current = true
    setFluxo('persistindo')
    try {
      await persistirDesbloqueio(trilha)
      if (!tentativaAtivaEh(attemptId)) return
      setDesbloqueadasSessao(prev => new Set(prev).add(trilha.slug))
      marcarTrilhaDesbloqueadaPorAnuncio(trilha.slug)
      setFluxo('sucesso')
    } catch {
      if (!tentativaAtivaEh(attemptId)) return
      setErroDesbloqueio('Não foi possível confirmar o desbloqueio. Tente novamente.')
      setFluxo('erro')
    }
  }

  async function tentarPersistirNovamente() {
    const attemptId = attemptIdAtivoRef.current
    const trilha = trilhaAlvoRef.current
    if (!attemptId || !trilha) return
    setErroDesbloqueio(null)
    setFluxo('persistindo')
    try {
      await persistirDesbloqueio(trilha)
      if (!tentativaAtivaEh(attemptId)) return
      setDesbloqueadasSessao(prev => new Set(prev).add(trilha.slug))
      marcarTrilhaDesbloqueadaPorAnuncio(trilha.slug)
      setFluxo('sucesso')
    } catch {
      if (!tentativaAtivaEh(attemptId)) return
      setErroDesbloqueio('Não foi possível confirmar o desbloqueio. Tente novamente.')
      setFluxo('erro')
    }
  }

  function entrarNaTrilha() {
    if (trilhaAlvo) router.push(`/trilha/${trilhaAlvo.slug}`)
  }

  return (
    <>
      {/* Mobile: zigzag map */}
      <div className="md:hidden flex flex-col items-center gap-4 py-4 px-4">
        {trilhas.map((trilha, i) => {
          const desbloqueadaNaturalmente =
            i === 0 ||
            (trilhas[i - 1]?.percentualConcluido ?? 0) === 100 ||
            trilha.desbloqueadaPorAnuncio ||
            desbloqueadasSessao.has(trilha.slug)
          const desbloqueada = isPro || desbloqueadaNaturalmente
          const liberadaPorPro = isPro && !desbloqueadaNaturalmente && (trilha.percentualConcluido ?? 0) === 0
          return (
            <div
              key={trilha.id}
              className="relative flex flex-col items-center"
              style={{ alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', marginLeft: i % 2 === 0 ? 20 : 0, marginRight: i % 2 === 0 ? 0 : 20 }}
            >
              {i > 0 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 border-l-2 border-dashed border-[#2a2d3a]" />
              )}
              <CardTrilha
                trilha={trilha}
                desbloqueada={desbloqueada}
                liberadaPorPro={liberadaPorPro}
                ultimaTrilha={trilha.ultimaTrilha}
                index={i}
                onBloqueadaClick={() => handleBloqueadaClick(trilha)}
              />
            </div>
          )
        })}
      </div>

      {/* Desktop: grid */}
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

      <BannerPro
        open={fluxo === 'banner'}
        onClose={() => {
          attemptIdAtivoRef.current = null
          setFluxo('idle')
        }}
        onAssistirAnuncio={iniciarAnuncios}
      />

      {fluxo === 'ad1' && (
        <AnuncioVideo
          key="trilha-rewarded-1"
          isPro={false}
          adType="rewarded"
          label="Anúncio 1 de 2"
          onConcluido={() => {
            const attemptId = attemptIdAtivoRef.current
            if (!attemptId) return
            primeiroAnuncioConcluido(attemptId)
          }}
          onFechar={() => {
            const attemptId = attemptIdAtivoRef.current
            if (!attemptId) return
            abortarDesbloqueioPorAnuncios(attemptId)
          }}
          onFalhou={() => {
            const attemptId = attemptIdAtivoRef.current
            if (!attemptId) return
            abortarDesbloqueioPorAnuncios(attemptId)
          }}
        />
      )}
      {fluxo === 'ad2' && (
        <AnuncioVideo
          key="trilha-rewarded-2"
          isPro={false}
          adType="rewarded"
          label="Anúncio 2 de 2"
          onConcluido={() => {
            const attemptId = attemptIdAtivoRef.current
            if (!attemptId) return
            void segundoAnuncioConcluido(attemptId)
          }}
          onFechar={() => {
            const attemptId = attemptIdAtivoRef.current
            if (!attemptId) return
            abortarDesbloqueioPorAnuncios(attemptId)
          }}
          onFalhou={() => {
            const attemptId = attemptIdAtivoRef.current
            if (!attemptId) return
            abortarDesbloqueioPorAnuncios(attemptId)
          }}
        />
      )}

      <AnimatePresence>
        {fluxo === 'transicao_ads' && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-4 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
            <p className="text-white/70 text-sm text-center">Preparando anúncio 2 de 2...</p>
            <p className="text-white/30 text-xs text-center">Aguarde um momento</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fluxo === 'persistindo' && (
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

      {/* Tela de sucesso após liberar trilha */}
      <AnimatePresence>
        {fluxo === 'sucesso' && trilhaAlvo && (
          <motion.div
            className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Ícone de sucesso */}
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

            {/* Textos */}
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

            {/* Botão */}
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

      <AnimatePresence>
        {fluxo === 'erro' && trilhaAlvo && (
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
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-white text-2xl font-bold">Falha ao liberar trilha</h2>
              <p className="text-white/60 text-sm">{erroDesbloqueio ?? 'Não foi possível finalizar agora.'}</p>
            </div>
            <div className="w-full max-w-xs flex flex-col gap-3">
              <button
                onClick={() => void tentarPersistirNovamente()}
                className="w-full py-4 rounded-xl bg-[#8b5cf6] text-white font-bold text-lg"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => setFluxo('banner')}
                className="w-full py-3 rounded-xl bg-white/5 text-white/70 font-medium"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
