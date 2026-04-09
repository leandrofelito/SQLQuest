'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface AnuncioVideoProps {
  isPro: boolean
  onConcluido: () => void
  onFechar?: () => void
  label?: string // ex: "Anúncio 1 de 2"
}

// Detecta se está rodando dentro do app Flutter (WebView com AdMobBridge)
function isFlutterApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).AdMobBridge
}

export function AnuncioVideo({ isPro, onConcluido, onFechar, label }: AnuncioVideoProps) {
  const [tempo, setTempo] = useState(30)
  const [adFailed, setAdFailed] = useState(false)
  const [flutterAdState, setFlutterAdState] = useState<'loading' | 'showing' | 'done' | 'failed'>('loading')
  const pushed = useRef(false)
  const adRef = useRef<HTMLModElement>(null)
  const flutter = useRef(isFlutterApp())

  useEffect(() => {
    if (isPro) {
      onConcluido()
      return
    }

    // --- Modo Flutter: AdMob nativo via JavascriptChannel ---
    if (flutter.current) {
      // Registra o callback que o Flutter vai chamar após o anúncio
      ;(window as any).onAdMobResult = (result: string) => {
        if (result === 'completed') {
          setFlutterAdState('done')
          onConcluido()
        } else {
          // Anúncio dispensado sem recompensa: inicia contagem regressiva curta
          setFlutterAdState('failed')
        }
      }

      // Solicita o anúncio ao Flutter
      const timer = setTimeout(() => {
        setFlutterAdState('showing')
        ;(window as any).AdMobBridge.postMessage('showAd')
      }, 300)

      return () => {
        clearTimeout(timer)
        delete (window as any).onAdMobResult
      }
    }

    // --- Modo Web: AdSense ---
    const timer = setTimeout(() => {
      if (!pushed.current) {
        pushed.current = true
        try {
          ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})

          // Verifica após 8s se o anúncio foi preenchido
          setTimeout(() => {
            const ins = adRef.current
            if (ins) {
              const status = ins.getAttribute('data-ad-status')
              if (status === 'unfilled') {
                setAdFailed(true)
              }
            }
          }, 8000)
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

  // Contagem curta após anúncio Flutter dispensado sem recompensa
  useEffect(() => {
    if (!flutter.current || flutterAdState !== 'failed') return
    setTempo(10)
    const interval = setInterval(() => {
      setTempo(t => {
        if (t <= 1) {
          clearInterval(interval)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [flutterAdState])

  if (isPro) return null

  // --- UI Flutter ---
  if (flutter.current) {
    if (flutterAdState === 'loading' || flutterAdState === 'showing') {
      return (
        <motion.div
          className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {onFechar && (
            <button
              onClick={onFechar}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Fechar sem prêmio"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <div className="w-12 h-12 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm">Carregando anúncio…</p>
        </motion.div>
      )
    }

    if (flutterAdState === 'failed') {
      return (
        <motion.div
          className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {onFechar && (
            <div className="flex justify-end px-4 pt-4 safe-top">
              <button
                onClick={onFechar}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Fechar sem prêmio"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4 py-8 px-6 rounded-2xl border border-white/10 bg-white/5">
              <p className="text-white/60 text-sm text-center">
                Aguarde para continuar
              </p>
            </div>
          </div>
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
              {tempo > 0 ? `Aguarde ${tempo}s…` : 'Continuar →'}
            </button>
          </div>
        </motion.div>
      )
    }

    return null
  }

  // --- UI Web (AdSense) ---
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
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/30">{label ?? 'Anúncio'}</div>
          {onFechar && (
            <button
              onClick={onFechar}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Fechar sem prêmio"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Área do anúncio */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {adFailed ? (
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
              style={{ display: 'block' }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
              data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TRILHA_MODAL}
              data-ad-format="auto"
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
