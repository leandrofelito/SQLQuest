'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface CertPreviewProps {
  trilha: {
    id: string
    slug: string
    titulo: string
    icone: string
  }
  isPro: boolean
  concluida: boolean
  certificadoHash?: string
}

export function CertPreview({ trilha, isPro, concluida, certificadoHash }: CertPreviewProps) {
  const router = useRouter()

  if (!concluida) return null

  return (
    <div className="mx-4 mb-6 rounded-2xl border border-[#2a2d3a] bg-gradient-to-br from-[#161820] to-[#0a0c12] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏅</span>
        <div>
          <p className="text-white font-bold text-sm">Trilha Concluída!</p>
          <p className="text-white/40 text-xs">{trilha.titulo}</p>
        </div>
      </div>

      {isPro ? (
        <Button
          onClick={() => router.push('/certificados')}
          fullWidth
          size="sm"
          variant="secondary"
        >
          {certificadoHash ? '🏅 Ver Certificado' : '⏳ Gerando certificado...'}
        </Button>
      ) : (
        <Button
          onClick={() => router.push('/upgrade')}
          fullWidth
          size="sm"
          variant="ghost"
        >
          🔒 Certificado disponível no Pro
        </Button>
      )}
    </div>
  )
}
