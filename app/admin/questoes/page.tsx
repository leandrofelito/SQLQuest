import { prisma } from '@/lib/db'
import { EtapaForm } from '@/app/admin/_components/EtapaForm'

async function togglePublicada(trilhaId: string, publicada: boolean) {
  'use server'
  await prisma.trilha.update({ where: { id: trilhaId }, data: { publicada } })
}

export default async function QuestoesPage() {
  const trilhas = await prisma.trilha.findMany({
    orderBy: { ordem: 'asc' },
    include: {
      etapas: {
        orderBy: { ordem: 'asc' },
        select: { id: true, ordem: true, tipo: true, titulo: true, xpReward: true, temAnuncio: true },
      },
    },
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-white font-bold text-xl">Gerenciar Questões</h1>

      <EtapaForm trilhas={trilhas.map(t => ({ id: t.id, titulo: t.titulo, slug: t.slug }))} />

      <div className="space-y-4">
        {trilhas.map(trilha => (
          <div key={trilha.id} className="bg-[#0f1117] border border-[#2a2d3a] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2d3a]">
              <div className="flex items-center gap-2">
                <span>{trilha.icone}</span>
                <span className="text-white font-semibold">{trilha.titulo}</span>
                <span className="text-white/30 text-xs">({trilha.etapas.length} etapas)</span>
              </div>
              <form action={togglePublicada.bind(null, trilha.id, !trilha.publicada)}>
                <button
                  type="submit"
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                    trilha.publicada
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                      : 'bg-[#1e2028] text-white/40 border border-[#2a2d3a]'
                  }`}
                >
                  {trilha.publicada ? '✓ Publicada' : 'Despublicada'}
                </button>
              </form>
            </div>
            <div className="divide-y divide-[#1e2028]">
              {trilha.etapas.map(etapa => (
                <div key={etapa.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#1e2028] flex items-center justify-center text-xs text-white/50 font-bold flex-shrink-0">
                    {etapa.ordem}
                  </span>
                  <span className="text-white/70 text-sm flex-1">{etapa.titulo}</span>
                  <span className="text-white/30 text-xs">{etapa.tipo}</span>
                  {etapa.xpReward > 0 && (
                    <span className="text-amber-400/60 text-xs">+{etapa.xpReward} XP</span>
                  )}
                  {etapa.temAnuncio && <span className="text-orange-400/60 text-xs">📢</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
