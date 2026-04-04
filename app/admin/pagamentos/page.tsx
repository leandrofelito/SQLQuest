import { prisma } from '@/lib/db'
import { PagamentosTable } from '@/components/admin/PagamentosTable'

interface PagamentosPageProps {
  searchParams: { periodo?: string }
}

export default async function PagamentosPage({ searchParams }: PagamentosPageProps) {
  const periodo = parseInt(searchParams.periodo ?? '30')
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - periodo)

  const pagamentos = await prisma.pagamento.findMany({
    where: { criadoEm: { gte: dataInicio } },
    orderBy: { criadoEm: 'desc' },
    include: { user: { select: { email: true, name: true } } },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Pagamentos</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map(p => (
            <a
              key={p}
              href={`?periodo=${p}`}
              className={`text-sm px-3 py-1.5 rounded-xl transition-colors ${
                periodo === p
                  ? 'bg-[#8b5cf6] text-white'
                  : 'bg-[#1e2028] text-white/40 hover:text-white'
              }`}
            >
              {p}d
            </a>
          ))}
        </div>
      </div>

      <PagamentosTable pagamentos={pagamentos} />
    </div>
  )
}
