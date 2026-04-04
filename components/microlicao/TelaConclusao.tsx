'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'
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
          <h2 className="text-2xl font-bold text-white">Parabéns!</h2>
          <p className="text-white/60 text-base">{conteudo.mensagem}</p>
        </div>

        <motion.div
          className="bg-amber-500/15 border border-amber-500/25 rounded-full px-6 py-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 250 }}
        >
          <span className="text-amber-300 font-bold text-lg">+{xpGanho > 0 ? xpGanho : conteudo.xpGanho} XP</span>
        </motion.div>

        {trilhaConcluida && (
          <motion.div
            className="w-full rounded-2xl border border-[#2a2d3a] bg-[#0f1117] p-4 text-center space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-3xl">🏅</div>
            <p className="text-white/80 font-semibold">Trilha concluída!</p>
            {isPro ? (
              <Button
                onClick={() => router.push('/certificados')}
                variant="secondary"
                fullWidth
                size="sm"
              >
                🏅 Ver Certificado
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/upgrade')}
                variant="secondary"
                fullWidth
                size="sm"
              >
                🔒 Certificado no Pro
              </Button>
            )}
          </motion.div>
        )}
      </div>

      <div className="w-full">
        <Button
          onClick={() => router.push(`/trilha/${trilhaSlug}`)}
          fullWidth
          size="lg"
          variant="secondary"
        >
          Ver trilha completa
        </Button>
      </div>
    </motion.div>
  )
}
