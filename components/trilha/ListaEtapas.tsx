'use client'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Etapa {
  id: string
  ordem: number
  tipo: string
  titulo: string
  xpReward: number
  concluida?: boolean
}

interface ListaEtapasProps {
  trilhaSlug: string
  etapas: Etapa[]
  etapaAtualOrdem: number
}

const TIPO_LABEL: Record<string, { label: string; variant: 'purple' | 'green' | 'blue' | 'orange' | 'gray' }> = {
  intro: { label: 'Intro', variant: 'blue' },
  texto: { label: 'Leitura', variant: 'gray' },
  resumo: { label: 'Resumo', variant: 'orange' },
  exercicio: { label: 'Exercício', variant: 'purple' },
  conclusao: { label: 'Conclusão', variant: 'green' },
}

export function ListaEtapas({ trilhaSlug, etapas, etapaAtualOrdem }: ListaEtapasProps) {
  const router = useRouter()

  return (
    <div className="space-y-2 px-4 py-2">
      {etapas.map((etapa, i) => {
        const done = etapa.concluida
        const current = etapa.ordem === etapaAtualOrdem
        const locked = etapa.ordem > etapaAtualOrdem && !done
        const tipo = TIPO_LABEL[etapa.tipo] ?? { label: etapa.tipo, variant: 'gray' as const }

        return (
          <button
            key={etapa.id}
            onClick={() => !locked && router.push(`/trilha/${trilhaSlug}/etapa/${etapa.id}`)}
            disabled={locked}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
              done ? 'bg-emerald-500/5 border-emerald-500/20' : current ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30' : locked ? 'bg-[#0f1117] border-[#1e2028] opacity-50 cursor-not-allowed' : 'bg-[#0f1117] border-[#2a2d3a] hover:border-[#363a4a]'
            )}
          >
            {/* Número circular */}
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
              done ? 'bg-emerald-500/20 text-emerald-400' : current ? 'bg-[#8b5cf6] text-white' : 'bg-[#1e2028] text-white/30'
            )}>
              {done ? '✓' : locked ? '🔒' : etapa.ordem}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-semibold text-sm truncate">{etapa.titulo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={tipo.variant} className="text-[10px]">{tipo.label}</Badge>
                {etapa.xpReward > 0 && (
                  <span className="text-xs text-amber-400/70">+{etapa.xpReward} XP</span>
                )}
              </div>
            </div>

            {/* Status */}
            {done && <span className="text-xs text-emerald-400 font-medium flex-shrink-0">✓ Concluída</span>}
          </button>
        )
      })}
    </div>
  )
}
