'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AdBanner } from '@/components/layout/AdBanner'
import { useUser } from '@/hooks/useUser'
import { useLocale } from '@/context/LocaleContext'
import type { ConteudoConclusao } from '@/types'

interface TelaConclusaoProps {
  conteudo: ConteudoConclusao
  xpGanho: number
  trilhaSlug: string
  trilhaId: string
  trilhaConcluida: boolean
  isPro: boolean
}

export function TelaConclusao({ conteudo, xpGanho, trilhaSlug, trilhaConcluida, isPro }: TelaConclusaoProps) {
  const router = useRouter()
  const { messages } = useLocale()

  return (
    <motion.div
      className="flex flex-col items-center justify-between h-full px-6 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="text-7xl"
        >
          🎉
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">{messages.conclusao.parabens}</h2>
          <p className="text-white/60 text-base">{conteudo.mensagem}</p>
        </div>

        {trilhaConcluida && (
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1a1520] to-[#0f1117] p-5 text-center space-y-3 shadow-lg shadow-amber-500/5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="text-4xl">🏅</div>
            <p className="text-white font-semibold">{messages.trilha.concluida_label}</p>
            <p className="text-white/45 text-xs leading-snug">{messages.conclusao.certificadoConvite}</p>
            {isPro ? (
              <Button
                onClick={() => router.push('/certificados')}
                variant="secondary"
                fullWidth
                size="lg"
              >
                {messages.trilha.verCertificado}
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/upgrade')}
                variant="secondary"
                fullWidth
                size="lg"
              >
                {messages.trilha.certPro}
              </Button>
            )}
          </motion.div>
        )}

        <motion.div
          className="bg-amber-500/15 border border-amber-500/25 rounded-full px-6 py-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 250 }}
        >
          <span className="text-amber-300 font-bold text-lg">+{xpGanho > 0 ? xpGanho : conteudo.xpGanho} XP</span>
        </motion.div>
      </div>

      {!isPro && (
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <AdBanner />
        </motion.div>
      )}

      <div className="w-full">
        <Button
          onClick={() => router.push(`/trilha/${trilhaSlug}`)}
          fullWidth
          size="lg"
          variant="secondary"
        >
          {messages.conclusao.verTrilha}
        </Button>
      </div>
    </motion.div>
  )
}
