'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { CardCertificado } from '@/components/certificado/CardCertificado'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useAppData } from '@/context/AppDataContext'

interface Cert {
  id: string
  hash: string
  emitidoEm: string
  trilha: {
    id: string
    slug: string
    titulo: string
    icone: string
  }
}

interface TrilhaPendente {
  id: string
  slug: string
  titulo: string
  icone: string
  percentualConcluido: number
}

function CertsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-[#0f1117] border border-[#1e2028] p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-white/10 rounded w-32" />
              <div className="h-2.5 bg-white/10 rounded w-20" />
            </div>
          </div>
          <div className="h-9 bg-white/10 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default function CertificadosPage() {
  const { user, isPro } = useUser()
  const router = useRouter()
  const { loadTrilhas, getCachedTrilhas } = useAppData()
  const [certs, setCerts] = useState<Cert[]>([])
  const [pendentes, setPendentes] = useState<TrilhaPendente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [certsRes, trilhas] = await Promise.all([
        fetch('/api/certificados').then(r => r.json()),
        loadTrilhas(),
      ])

      try {
        const certsData = Array.isArray(certsRes) ? certsRes : []
        setCerts(certsData)

        const certTrilhaIds = new Set(certsData.map((c: Cert) => c.trilha.id))
        setPendentes(trilhas.filter(t => !certTrilhaIds.has(t.id) && t.percentualConcluido > 0 && t.percentualConcluido < 100))
      } catch {}

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] pb-[calc(5rem+var(--safe-area-bottom,0px))]">
        <Header title="Certificados" />
        <div className="max-w-3xl mx-auto px-4 pt-4 space-y-6">
          <CertsSkeleton />
        </div>
        <NavBottom />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080a0f] pb-[calc(5rem+var(--safe-area-bottom,0px))]">
      <Header title="Certificados" />

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-6">
        {!isPro && (
          <div className="rounded-2xl bg-[#0f1117] border border-[#8b5cf6]/30 p-5 space-y-3 text-center">
            <div className="text-4xl">🏅</div>
            <h3 className="text-white font-bold">Certificados Pro</h3>
            <p className="text-white/50 text-sm">Conclua trilhas e baixe certificados PDF para compartilhar.</p>
            <Button onClick={() => router.push('/upgrade')} fullWidth>
              Assinar Pro — R$19,90
            </Button>
          </div>
        )}

        {certs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wide">Conquistados</h2>
            {certs.map(cert => (
              <CardCertificado
                key={cert.id}
                certificado={cert}
                userName={user?.name ?? 'Usuário'}
                isPro={isPro}
              />
            ))}
          </div>
        )}

        {certs.length === 0 && isPro && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-white/40">Complete trilhas para ganhar certificados.</p>
          </div>
        )}

        {pendentes.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white/40 text-sm font-semibold uppercase tracking-wide">Em andamento</h2>
            {pendentes.map(t => (
              <button
                key={t.id}
                onClick={() => router.push(`/trilha/${t.slug}`)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0f1117] border border-[#1e2028] text-left hover:border-[#2a2d3a] transition-colors"
              >
                <span className="text-3xl">{t.icone}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{t.titulo}</p>
                  <p className="text-white/40 text-xs">{t.percentualConcluido}% concluído</p>
                </div>
                <span className="text-white/30 text-sm">→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <NavBottom />
    </div>
  )
}
