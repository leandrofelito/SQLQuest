'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAdsenseClientId, hasAdsenseModalUnit } from '@/lib/adsense-config'
import { useNativeAdHost } from '@/hooks/useNativeAdHost'

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

// Timer inicial: rewarded=30s, interstitial=15s
const TIMER_INICIAL: Record<AdType, number> = { rewarded: 30, interstitial: 15 }

export function AnuncioVideo({ isPro, onConcluido, onFechar, onFalhou, label, adType = 'rewarded' }: AnuncioVideoProps) {
  const [tempo, setTempo] = useState(TIMER_INICIAL[adType])
  const [adFailed, setAdFailed] = useState(false)
  const [flutterAdState, setFlutterAdState] = useState<'loading' | 'showing' | 'done'>('loading')
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const nativeHost = useNativeAdHost()
  const pushed = useRef(false)
  const adRef = useRef<HTMLModElement>(null)
  // Ref para sempre chamar a versão mais recente do callback sem reiniciar o efeito
  const onConcluidoRef = useRef(onConcluido)
  const onFecharRef = useRef(onFechar)
  const onFalhouRef = useRef(onFalhou)
  /** Após cleanup do efeito Flutter: evita setState no desmontado; `completed` tardio ainda usa os refs. */
  const flutterHostReleasedRef = useRef(false)
  const resolvedRef = useRef(false)
  useEffect(() => { onConcluidoRef.current = onConcluido }, [onConcluido])
  useEffect(() => { onFecharRef.current = onFechar }, [onFechar])
  useEffect(() => { onFalhouRef.current = onFalhou }, [onFalhou])

  function resolveOnce(action: 'completed' | 'dismissed' | 'failed') {
    if (resolvedRef.current) return
    resolvedRef.current = true

    if (action === 'completed') {
      onConcluidoRef.current()
      return
    }
    if (action === 'failed') {
      if (onFalhouRef.current) onFalhouRef.current()
      else onFecharRef.current?.()
      return
    }
    onFecharRef.current?.()
  }

  function tentarFechar() {
    if (onFechar) setConfirmandoSaida(true)
  }

  function confirmarSaida() {
    setConfirmandoSaida(false)
    onFechar?.()
  }

  useEffect(() => {
    resolvedRef.current = false
    if (isPro) {
      resolveOnce('completed')
      return
    }

    if (nativeHost === 'pending') {
      return
    }

    // --- Modo Flutter: AdMob nativo via JavascriptChannel ---
    if (nativeHost === 'native') {
      flutterHostReleasedRef.current = false
      const expectedRequestId =
        adType === 'rewarded'
          ? typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
          : null

      // Grace period: alguns SDKs de mediação disparam 'dismissed' antes de 'completed'.
      // Aguardamos até 900ms para ver se 'completed' chega logo após 'dismissed'.
      let rewardEarned = false
      let rewardedGraceTimeout: ReturnType<typeof setTimeout> | null = null

      const handler = (result: string) => {
        let status = result
        let msgRequestId: string | undefined
        try {
          const o = JSON.parse(result) as { status?: string; requestId?: string }
          if (o && typeof o.status === 'string') {
            status = o.status
            if (typeof o.requestId === 'string') msgRequestId = o.requestId
          }
        } catch {
          // Legado: result é a string 'completed' | 'dismissed' | 'failed'
        }
        // Algumas bridges legadas retornam status sem requestId.
        // Nesse caso, aceitamos o callback para evitar travar o fluxo de recompensa.
        if (expectedRequestId !== null && msgRequestId && msgRequestId !== expectedRequestId) {
          return
        }

        if (!flutterHostReleasedRef.current) {
          setFlutterAdState('done')
        }

        if (adType === 'interstitial') {
          // Interstitial: avança independentemente de ter assistido até o fim
          resolveOnce('completed')
          return
        }

        // Rewarded: trata com grace period para 'dismissed' que chega antes de 'completed'
        const normalizedStatus = String(status).toLowerCase()
        if (normalizedStatus === 'completed' || normalizedStatus === 'rewarded' || normalizedStatus === 'earned') {
          rewardEarned = true
          if (rewardedGraceTimeout !== null) {
            clearTimeout(rewardedGraceTimeout)
            rewardedGraceTimeout = null
          }
          resolveOnce('completed')
        } else if (normalizedStatus === 'failed') {
          if (rewardedGraceTimeout !== null) {
            clearTimeout(rewardedGraceTimeout)
            rewardedGraceTimeout = null
          }
          resolveOnce('failed')
        } else if (normalizedStatus === 'dismissed') {
          // Se a recompensa já foi concedida antes do dismiss, ignora o dismiss
          if (rewardEarned) return
          // Aguarda brevemente: alguns SDKs enviam 'dismissed' antes de 'completed'
          rewardedGraceTimeout = setTimeout(() => {
            rewardedGraceTimeout = null
            if (rewardEarned) return
            // Em alguns WebViews/mediadores Android, rewarded concluído ainda chega como "dismissed".
            // Para não bloquear o fluxo de dica após o anúncio, liberamos a recompensa no host nativo.
            resolveOnce(nativeHost === 'native' ? 'completed' : 'dismissed')
          }, 900)
        } else {
          resolveOnce('failed')
        }
      }
      ;(window as any).onAdMobResult = handler

      const timer = setTimeout(() => {
        setFlutterAdState('showing')
        if (adType === 'interstitial') {
          ;(window as any).AdMobBridge.postMessage('showInterstitialAd')
        } else if (expectedRequestId) {
          ;(window as any).AdMobBridge.postMessage(
            JSON.stringify({ action: 'showRewardedAd', requestId: expectedRequestId }),
          )
        } else {
          ;(window as any).AdMobBridge.postMessage('showRewardedAd')
        }
      }, 300)

      return () => {
        clearTimeout(timer)
        if (rewardedGraceTimeout !== null) {
          clearTimeout(rewardedGraceTimeout)
          rewardedGraceTimeout = null
        }
        flutterHostReleasedRef.current = true
        // Não apagar na hora: `completed` pode chegar após dismiss (AdMob / mediação).
        const handlerSnapshot = handler
        setTimeout(() => {
          if ((window as any).onAdMobResult === handlerSnapshot) {
            delete (window as any).onAdMobResult
          }
        }, 2600)
      }
    }

    // --- Modo Web: AdSense ---
    const timer = setTimeout(() => {
      if (!pushed.current) {
        pushed.current = true
        if (!hasAdsenseModalUnit()) {
          setAdFailed(true)
          return
        }
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
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [isPro, adType, nativeHost])

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

  if (nativeHost === 'pending') {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-12 h-12 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
        <p className="text-white/50 text-sm text-center">Carregando anúncio…</p>
        {label ? <p className="text-white/30 text-xs text-center">{label}</p> : null}
      </motion.div>
    )
  }

  // --- UI Flutter ---
  // Sem botão X sobre o WebView: o fechamento é pelo próprio anúncio nativo;
  // um X em cima confundia com o anúncio e, ao fechar o vídeo, o callback
  // `dismissed` já trata saída sem prêmio.
  if (nativeHost === 'native') {
    // Mantém overlay visível em todos os estados (loading, showing, done) para impedir
    // que o usuário interaja com o mapa durante a transição entre anúncios (ex.: 1400ms
    // entre ad1 concluído e ad2 iniciado). Se o overlay sumir o usuário pode tocar em
    // outra trilha, invalidar o attemptId e o 2º anúncio nunca é exibido.
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-[#080a0f] flex flex-col items-center justify-center gap-6 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-12 h-12 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
        <p className="text-white/50 text-sm text-center">
          {flutterAdState === 'done' ? 'Aguarde…' : 'Carregando anúncio…'}
        </p>
        {label ? <p className="text-white/30 text-xs text-center">{label}</p> : null}
      </motion.div>
    )
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
              data-ad-client={getAdsenseClientId() ?? ''}
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
          onClick={() => resolveOnce('completed')}
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
            className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            {adType === 'rewarded' ? 'Fechar anúncio e continuar' : 'Fechar anúncio'}
          </button>
        )}
      </div>

      {modalConfirmacao}
    </motion.div>
  )
}
