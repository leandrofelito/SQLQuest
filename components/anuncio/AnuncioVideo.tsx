'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface AnuncioVideoProps {
  isPro: boolean
  onConcluido: () => void
  label?: string // ex: "Anúncio 1 de 2"
}

export function AnuncioVideo({ isPro, onConcluido, label }: AnuncioVideoProps) {
  const [tempo, setTempo] = useState(30)
  const [adFailed, setAdFailed] = useState(false)
  const pushed = useRef(false)
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (isPro) {
      onConcluido()
      return
    }

    // Aguarda um tick para garantir que o script do AdSense foi carregado
    const timer = setTimeout(() => {
      if (!pushed.current) {
        pushed.current = true
        try {
          ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})

          // Verifica após 3s se o anúncio foi preenchido
          setTimeout(() => {
            const ins = adRef.current
            if (ins) {
              const status = ins.getAttribute('data-ad-status')
              if (status === 'unfilled' || status === null) {
                setAdFailed(true)
              }
            }
          }, 3000)
        } catch {
          setAdFailed(true)
        }
      }
    }, 500)

    const interval = setInterval(() => {
      setTempo(t => {
        if (t <= 1) {
          clearInterval(interval)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [isPro, onConcluido])

  if (isPro) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Topo */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-top">
        <div className="bg-black/40 rounded-full px-3 py-1">
          <span className="text-white/60 text-sm">
            {tempo > 0 ? `${tempo}s até o prêmio` : 'Pronto!'}
          </span>
        </div>
        <div className="text-xs text-white/30">{label ?? 'Anúncio'}</div>
      </div>

      {/* Área do anúncio */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {adFailed ? (
            /* Fallback visual quando nenhum anúncio é servido */
            <div className="flex flex-col items-center justify-center gap-4 py-8 px-6 rounded-2xl border border-white/10 bg-white/5">
              <div className="w-16 h-16 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-white/60 text-sm text-center">
                Aguarde alguns segundos para liberar o próximo nível
              </p>
            </div>
          ) : (
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: 250 }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
              data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT}
              data-ad-format="rectangle"
              data-full-width-responsive="true"
            />
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-4 pb-6 space-y-3 safe-bottom">
        <button
          onClick={onConcluido}
          disabled={tempo > 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            tempo === 0
              ? 'bg-[#8b5cf6] text-white'
              : 'bg-[#1e2028] text-white/30 cursor-not-allowed'
          }`}
        >
          {tempo > 0 ? `Aguarde ${tempo}s...` : 'Continuar →'}
        </button>
        <p className="text-center text-xs text-white/30">
          Assine Pro para pular anúncios
        </p>
      </div>
    </motion.div>
  )
}
