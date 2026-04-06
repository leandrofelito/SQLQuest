'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardTrilha } from './CardTrilha'
import { BannerPro } from '@/components/anuncio/BannerPro'
import { AnuncioVideo } from '@/components/anuncio/AnuncioVideo'
import { useUser } from '@/hooks/useUser'

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
}

interface MapaTrilhasProps {
  trilhas: TrilhaData[]
}

export function MapaTrilhas({ trilhas }: MapaTrilhasProps) {
  const { isPro } = useUser()
  const router = useRouter()
  const [showBanner, setShowBanner] = useState(false)
  const [trilhaAlvo, setTrilhaAlvo] = useState<string | null>(null)
  // 0 = nenhum anúncio, 1 = primeiro anúncio, 2 = segundo anúncio
  const [adEtapa, setAdEtapa] = useState<0 | 1 | 2>(0)
  // Desbloqueios feitos nesta sessão (otimista), antes do reload
  const [desbloqueadasSessao, setDesbloqueadasSessao] = useState<Set<string>>(new Set())

  function handleBloqueadaClick(slug: string) {
    setTrilhaAlvo(slug)
    setShowBanner(true)
  }

  function iniciarAnuncios() {
    setShowBanner(false)
    setAdEtapa(1)
  }

  function primeiroAnuncioConcluido() {
    setAdEtapa(2)
  }

  async function segundoAnuncioConcluido() {
    setAdEtapa(0)
    if (trilhaAlvo) {
      // Atualização otimista para feedback imediato
      setDesbloqueadasSessao(prev => new Set(prev).add(trilhaAlvo!))
      // Persiste no banco vinculado ao usuário logado
      await fetch('/api/desbloquear-trilha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trilhaSlug: trilhaAlvo }),
      })
      router.push(`/trilha/${trilhaAlvo}`)
    }
  }

  return (
    <>
      {/* Mobile: zigzag map */}
      <div className="md:hidden flex flex-col items-center gap-4 py-4 px-4">
        {trilhas.map((trilha, i) => {
          const desbloqueada =
            i === 0 ||
            (trilhas[i - 1]?.percentualConcluido ?? 0) === 100 ||
            trilha.desbloqueadaPorAnuncio || desbloqueadasSessao.has(trilha.slug)
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
                index={i}
                onBloqueadaClick={() => handleBloqueadaClick(trilha.slug)}
              />
            </div>
          )
        })}
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-4">
        {trilhas.map((trilha, i) => {
          const desbloqueada =
            i === 0 ||
            (trilhas[i - 1]?.percentualConcluido ?? 0) === 100 ||
            trilha.desbloqueadaPorAnuncio || desbloqueadasSessao.has(trilha.slug)
          return (
            <CardTrilha
              key={trilha.id}
              trilha={trilha}
              desbloqueada={desbloqueada}
              index={i}
              onBloqueadaClick={() => handleBloqueadaClick(trilha.slug)}
              fullWidth
            />
          )
        })}
      </div>

      <BannerPro
        open={showBanner}
        onClose={() => setShowBanner(false)}
        onAssistirAnuncio={iniciarAnuncios}
      />

      {adEtapa === 1 && (
        <AnuncioVideo isPro={false} label="Anúncio 1 de 2" onConcluido={primeiroAnuncioConcluido} />
      )}
      {adEtapa === 2 && (
        <AnuncioVideo isPro={false} label="Anúncio 2 de 2" onConcluido={segundoAnuncioConcluido} />
      )}
    </>
  )
}
