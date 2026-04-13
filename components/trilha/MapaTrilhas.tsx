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

type FluxoState = 'idle' | 'banner' | 'ad1' | 'ad2' | 'sucesso'

export function MapaTrilhas({ trilhas }: MapaTrilhasProps) {
  const { isPro } = useUser()
  const { marcarTrilhaDesbloqueadaPorAnuncio } = useAppData()
  const router = useRouter()
  const [fluxo, setFluxo] = useState<FluxoState>('idle')
  const [trilhaAlvo, setTrilhaAlvo] = useState<TrilhaData | null>(null)
  const [desbloqueadasSessao, setDesbloqueadasSessao] = useState<Set<string>>(new Set())
  const desbloqueioSegundoJaFeito = useRef(false)

  function handleBloqueadaClick(trilha: TrilhaData) {
    desbloqueioSegundoJaFeito.current = false
    setTrilhaAlvo(trilha)
    setFluxo('banner')
  }

  function iniciarAnuncios() {
    desbloqueioSegundoJaFeito.current = false
    // Fecha o banner primeiro para evitar sobreposição com o anúncio
    setFluxo('idle')
    setTimeout(() => setFluxo('ad1'), 380)
  }

  function primeiroAnuncioConcluido() {
    // Pausa para o AdMob concluir dismiss + carregar o próximo rewarded (mobile)
    setTimeout(() => setFluxo('ad2'), 600)
  }

  /** Fechar/sair sem recompensa não avança nem libera; volta ao banner para tentar de novo. */
  function abortarDesbloqueioPorAnuncios() {
    setFluxo('banner')
  }

  async function segundoAnuncioConcluido() {
    if (!trilhaAlvo) return
    if (desbloqueioSegundoJaFeito.current) return
    desbloqueioSegundoJaFeito.current = true
    setDesbloqueadasSessao(prev => new Set(prev).add(trilhaAlvo.slug))
    setFluxo('sucesso')
    const res = await fetch('/api/desbloquear-trilha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trilhaSlug: trilhaAlvo.slug }),
    })
    if (res.ok) {
      marcarTrilhaDesbloqueadaPorAnuncio(trilhaAlvo.slug)
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
        onClose={() => setFluxo('idle')}
        onAssistirAnuncio={iniciarAnuncios}
      />

      {fluxo === 'ad1' && (
        <AnuncioVideo
          key="trilha-rewarded-1"
          isPro={false}
          adType="rewarded"
          label="Anúncio 1 de 2"
          onConcluido={primeiroAnuncioConcluido}
          onFechar={abortarDesbloqueioPorAnuncios}
          onFalhou={() => setFluxo('banner')}
        />
      )}
      {fluxo === 'ad2' && (
        <AnuncioVideo
          key="trilha-rewarded-2"
          isPro={false}
          adType="rewarded"
          label="Anúncio 2 de 2"
          onConcluido={segundoAnuncioConcluido}
          onFechar={abortarDesbloqueioPorAnuncios}
          onFalhou={() => setFluxo('banner')}
        />
      )}

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
    </>
  )
}
