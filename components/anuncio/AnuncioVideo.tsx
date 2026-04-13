'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type AdType = 'rewarded' | 'interstitial'

interface AnuncioVideoProps {
  isPro: boolean
  onConcluido: () => void
  onFechar?: () => void
  /** Flutter: falha de load/show do rewarded — se omitido, cai em onFechar */
  onFalhou?: () => void
  label?: string // ex: "Anúncio 1 de 2"
  adType?: AdType // 'rewarded' (dica/trilha) | 'interstitial' (frequência)
}

// Detecta se está rodando dentro do app Flutter (WebView com AdMobBridge)
function isFlutterApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).AdMobBridge
}

// Timer inicial: rewarded=30s, interstitial=15s
const TIMER_INICIAL: Record<AdType, number> = { rewarded: 30, interstitial: 15 }

export function AnuncioVideo({ isPro, onConcluido, onFechar, onFalhou, label, adType = 'rewarded' }: AnuncioVideoProps) {
  const [tempo, setTempo] = useState(TIMER_INICIAL[adType])
  const [adFailed, setAdFailed] = useState(false)
  const [flutterAdState, setFlutterAdState] = useState<'loading' | 'showing' | 'done'>('loading')
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const pushed = useRef(false)
  const adRef = useRef<HTMLModElement>(null)
  const flutter = useRef(isFlutterApp())
  // Ref para sempre chamar a versão mais recente do callback sem reiniciar o efeito
  const onConcluidoRef = useRef(onConcluido)
  const onFecharRef = useRef(onFechar)
  const onFalhouRef = useRef(onFalhou)
  useEffect(() => { onConcluidoRef.current = onConcluido }, [onConcluido])
  useEffect(() => { onFecharRef.current = onFechar }, [onFechar])
  useEffect(() => { onFalhouRef.current = onFalhou }, [onFalhou])

  function tentarFechar() {
    if (onFechar) setConfirmandoSaida(true)
  }

  function confirmarSaida() {
    setConfirmandoSaida(false)
    onFechar?.()
  }

  useEffect(() => {
    if (isPro) {
      onConcluidoRef.current()
      return
    }

    // --- Modo Flutter: AdMob nativo via JavascriptChannel ---
    if (flutter.current) {
      ;(window as any).onAdMobResult = (result: string) => {
        setFlutterAdState('done')
        if (adType === 'interstitial') {
          // Interstitial: avança independentemente de ter assistido até o fim
          onConcluidoRef.current()
        } else {
          // Rewarded: completed = recompensa; failed = erro técnico; dismissed = fechou sem prêmio
          if (result === 'completed') {
            onConcluidoRef.current()
          } else if (result === 'failed') {
            if (onFalhouRef.current) onFalhouRef.current()
            else onFecharRef.current?.()
          } else {
            onFecharRef.current?.()
          }
        }
      }

      const timer = setTimeout(() => {
        setFlutterAdState('showing')
        const msg = adType === 'interstitial' ? 'showInterstitialAd' : 'showRewardedAd'
        ;(window as any).AdMobBridge.postMessage(msg)
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

          setTimeout(() => {
            const ins = adRef.current
            if (ins && ins.getAttribute('data-ad-status') === 'unfilled') {
              setAdFailed(true)
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
          onConcluidoRef.current()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro])

  if (isPro) return null

  // Modal de confirmação — texto neutro para funcionar em qualquer contexto
  const modalConfirmacao = (
    <AnimatePresence>
      {confirmandoSaida && (
        <motion.div
          className="absolute inset-0 z-10 flex items-end justify-center bg-black/70 backdrop-blur-sm pb-8 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm bg-[#12141c] rounded-2xl border border-white/10 p-6 flex flex-col gap-4"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg">Tem certeza?</h3>
              <p className="text-white/50 text-sm">
                {adType === 'rewarded'
                  ? 'Se sair agora você não receberá o prêmio.'
                  : 'Deseja fechar o anúncio?'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setConfirmandoSaida(false)}
                className="w-full py-3 rounded-xl bg-[#8b5cf6] text-white font-bold"
              >
                Continuar assistindo
              </button>
              <button
                onClick={confirmarSaida}
                className="w-full py-3 rounded-xl bg-white/5 text-white/50 font-medium"
              >
                {adType === 'rewarded' ? 'Sair sem prêmio' : 'Fechar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // --- UI Flutter ---
  // Sem botão X sobre o WebView: o fechamento é pelo próprio anúncio nativo;
  // um X em cima confundia com o anúncio e, ao fechar o vídeo, o callback
  // `dismissed` já trata saída sem prêmio.
  if (flutter.current) {
    if (flutterAdState === 'loading' || flutterAdState === 'showing') {
      return (
        <motion.div
          className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm">Carregando anúncio…</p>
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
      <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-top gap-3">
        <div className="bg-black/40 rounded-full px-3 py-1 shrink-0">
          <span className="text-white/60 text-sm">
            {tempo > 0 ? `${tempo}s até o prêmio` : 'Pronto!'}
          </span>
        </div>
        <div className="text-xs text-white/30 text-right min-w-0">{label ?? 'Anúncio'}</div>
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
        {onFechar && (
          <button
            type="button"
            onClick={tentarFechar}
            className="w-full text-center text-xs text-white/35 hover:text-white/50 underline underline-offset-2 py-1"
          >
            Sair sem assistir
          </button>
        )}
      </div>

      {modalConfirmacao}
    </motion.div>
  )
}
