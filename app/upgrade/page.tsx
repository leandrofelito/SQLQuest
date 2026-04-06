'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

const SLIDES = [
  {
    emoji: '📚',
    titulo: 'Acesso a tudo',
    desc: '8 trilhas completas de SQL básico ao avançado, sem restrições.',
  },
  {
    emoji: '🏅',
    titulo: 'Certificados PDF',
    desc: 'Certificados de conclusão validáveis por link público.',
  },
  {
    emoji: '🚫',
    titulo: 'Sem anúncios',
    desc: 'Aprenda sem interrupções. Nenhum anúncio, nunca.',
  },
  {
    emoji: '♾️',
    titulo: 'Para sempre',
    desc: 'Pagamento único. Acesso vitalício. Sem mensalidade.',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [slideAtual, setSlideAtual] = useState(0)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSlideAtual(s => (s + 1) % SLIDES.length)
    }, 2500)
    return () => clearInterval(intervalRef.current)
  }, [])

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col">
      {/* Fechar */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 right-4 z-10 text-white/40 hover:text-white transition-colors p-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col justify-between px-6 pt-12 pb-8">
        {/* Carrossel */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideAtual}
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-8xl">{SLIDES[slideAtual].emoji}</div>
              <h2 className="text-2xl font-bold text-white">{SLIDES[slideAtual].titulo}</h2>
              <p className="text-white/50 text-base max-w-xs mx-auto">{SLIDES[slideAtual].desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlideAtual(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === slideAtual ? 'w-6 bg-[#8b5cf6]' : 'w-1.5 bg-[#2a2d3a]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Preço e CTA */}
        <div className="space-y-4">
          <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-3xl p-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/30 line-through text-lg">R$149,99</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/25">
                80% OFF
              </span>
            </div>
            <p className="text-5xl font-bold text-white">
              R$<span className="text-[#a78bfa]">59</span>
              <span className="text-2xl">,90</span>
            </p>
            <p className="text-white/30 text-sm">Pagamento único · Acesso vitalício</p>
          </div>

          <Button onClick={handleCheckout} loading={loading} fullWidth size="lg">
            OBTENHA PRO PARA VIDA ÚTIL
          </Button>

          <button
            onClick={() => router.back()}
            className="w-full text-white/30 text-sm py-2 hover:text-white/50 transition-colors"
          >
            Continuar com anúncios
          </button>
        </div>
      </div>
    </div>
  )
}
