'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface BannerProProps {
  open: boolean
  onClose: () => void
  onAssistirAnuncio: () => void
}

export function BannerPro({ open, onClose, onAssistirAnuncio }: BannerProProps) {
  const router = useRouter()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1117] rounded-t-3xl border-t border-[#2a2d3a] p-6 safe-bottom"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Fechar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Conteúdo */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔒</div>
              <h3 className="text-xl font-bold text-white mb-1">Quer acessar gratuitamente?</h3>
              <p className="text-white/50 text-sm">Assista 2 anúncios curtos ou assine o Pro para acesso total.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onAssistirAnuncio}
                className="w-full py-4 rounded-xl bg-[#1e2028] text-white font-semibold border border-[#2a2d3a] hover:border-[#363a4a] transition-colors"
              >
                Continuar (Com anúncios)
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#2a2d3a]" />
                <span className="text-white/30 text-xs font-medium">OU</span>
                <div className="flex-1 h-px bg-[#2a2d3a]" />
              </div>

              <button
                onClick={() => router.push('/upgrade')}
                className="w-full py-4 rounded-xl bg-[#8b5cf6] text-white font-bold text-base hover:bg-[#7c3aed] transition-colors"
              >
                ASSINAR PRO — R$59,90
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
