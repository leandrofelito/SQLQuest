import { prisma } from '@/lib/db'

export default async function AdminDashboard() {
  const [totalUsers, proUsers, pagamentos, ultimaVenda] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPro: true } }),
    prisma.pagamento.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 10,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.pagamento.findFirst({ where: { status: 'paid' }, orderBy: { criadoEm: 'desc' } }),
  ])

  const receitaTotal = pagamentos.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.valor, 0)

  async function sincronizarTrilhas() {
    'use server'
    const fs = await import('fs')
    const path = await import('path')
    const dir = path.join(process.cwd(), 'content/trilhas/core')
    const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.json')).sort()

    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
      const trilha = await prisma.trilha.upsert({
        where: { slug: data.slug },
        update: { titulo: data.titulo, descricao: data.descricao, icone: data.icone, ordem: data.ordem, totalEtapas: data.etapas.length, xpTotal: data.xpTotal, publicada: true },
        create: { slug: data.slug, titulo: data.titulo, descricao: data.descricao, icone: data.icone, ordem: data.ordem, totalEtapas: data.etapas.length, xpTotal: data.xpTotal, publicada: true },
      })
      for (const etapa of data.etapas) {
        await prisma.etapa.upsert({
          where: { trilhaId_ordem: { trilhaId: trilha.id, ordem: etapa.ordem } },
          update: { tipo: etapa.tipo, titulo: etapa.titulo, conteudo: etapa.conteudo, xpReward: etapa.xpReward, temAnuncio: etapa.temAnuncio },
          create: { trilhaId: trilha.id, ordem: etapa.ordem, tipo: etapa.tipo, titulo: etapa.titulo, conteudo: etapa.conteudo, xpReward: etapa.xpReward, temAnuncio: etapa.temAnuncio },
        })
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-white font-bold text-xl">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Usuários', value: totalUsers, emoji: '👥' },
          { label: 'Usuários Pro', value: proUsers, emoji: '⭐' },
          { label: 'Receita Total', value: `R$ ${(receitaTotal / 100).toFixed(2).replace('.', ',')}`, emoji: '💰' },
          { label: 'Última Venda', value: ultimaVenda ? new Date(ultimaVenda.criadoEm).toLocaleDateString('pt-BR') : '—', emoji: '🕐' },
        ].map(s => (
          <div key={s.label} className="bg-[#0f1117] border border-[#2a2d3a] rounded-2xl p-4">
            <div className="text-2xl mb-2">{s.emoji}</div>
            <div className="text-white font-bold text-xl">{s.value}</div>
            <div className="text-white/40 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sincronizar */}
      <form action={sincronizarTrilhas}>
        <button
          type="submit"
          className="bg-[#8b5cf6] text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#7c3aed] transition-colors"
        >
          🔄 Sincronizar banco com JSONs
        </button>
      </form>

      {/* Últimos pagamentos */}
      <div>
        <h2 className="text-white/70 font-semibold mb-3">Últimos pagamentos</h2>
        <div className="bg-[#0f1117] rounded-2xl border border-[#2a2d3a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a] bg-[#161820]">
                <th className="px-4 py-3 text-left text-white/40 font-semibold">Email</th>
                <th className="px-4 py-3 text-right text-white/40 font-semibold">Valor</th>
                <th className="px-4 py-3 text-left text-white/40 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map(p => (
                <tr key={p.id} className="border-b border-[#1e2028]">
                  <td className="px-4 py-3 text-white/70">{p.user.email}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">R$ {(p.valor / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-yellow-500/15 text-yellow-300'
                    }`}>{p.status === 'paid' ? 'Pago' : p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagamentos.length === 0 && (
            <div className="py-8 text-center text-white/30 text-sm">Nenhum pagamento ainda</div>
          )}
        </div>
      </div>
    </div>
  )
}
