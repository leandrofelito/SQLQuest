'use client'
import { formatData } from '@/lib/utils'

interface Pagamento {
  id: string
  stripeSessionId: string
  valor: number
  status: string
  criadoEm: Date | string
  user: {
    email: string
    name?: string | null
  }
}

interface PagamentosTableProps {
  pagamentos: Pagamento[]
}

export function PagamentosTable({ pagamentos }: PagamentosTableProps) {
  function exportCSV() {
    const header = 'Email,Nome,Data,Valor,Status'
    const rows = pagamentos.map(p =>
      `${p.user.email},${p.user.name ?? ''},${new Date(p.criadoEm).toISOString()},${(p.valor / 100).toFixed(2)},${p.status}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pagamentos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const total = pagamentos.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.valor, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs">Total arrecadado (pagos)</p>
          <p className="text-white font-bold text-xl">
            R$ {(total / 100).toFixed(2).replace('.', ',')}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="text-sm text-[#a78bfa] border border-[#8b5cf6]/30 px-3 py-1.5 rounded-xl hover:bg-[#8b5cf6]/10 transition-colors"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="rounded-2xl border border-[#2a2d3a] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d3a] bg-[#161820]">
              <th className="px-4 py-3 text-left text-white/40 font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-white/40 font-semibold">Data</th>
              <th className="px-4 py-3 text-right text-white/40 font-semibold">Valor</th>
              <th className="px-4 py-3 text-left text-white/40 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map(p => (
              <tr key={p.id} className="border-b border-[#1e2028] hover:bg-[#1e2028]/50">
                <td className="px-4 py-3 text-white/80">{p.user.email}</td>
                <td className="px-4 py-3 text-white/50">{formatData(new Date(p.criadoEm))}</td>
                <td className="px-4 py-3 text-right font-mono text-white">
                  R$ {(p.valor / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    p.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-yellow-500/15 text-yellow-300'
                  }`}>
                    {p.status === 'paid' ? 'Pago' : p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagamentos.length === 0 && (
          <div className="py-10 text-center text-white/30 text-sm">Nenhum pagamento encontrado</div>
        )}
      </div>
    </div>
  )
}
