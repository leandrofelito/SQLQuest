'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { CardCertificado } from '@/features/certificates/components/CardCertificado'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useAppData, type CertificadoBasico } from '@/context/AppDataContext'
import { useLocale } from '@/context/LocaleContext'

type Cert = CertificadoBasico

interface TrilhaPendente {
  id: string
  slug: string
  titulo: string
  icone: string
  percentualConcluido: number
}

interface TrilhaConcluida {
  id: string
  slug: string
  titulo: string
  icone: string
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
  const { loadTrilhas, trilhasRevision, loadCertificados, getCachedCertificados } = useAppData()
  const { messages } = useLocale()
  const m = messages.certificados
  const [certs, setCerts] = useState<Cert[]>(() => getCachedCertificados() ?? [])
  const [pendentes, setPendentes] = useState<TrilhaPendente[]>([])
  const [concluidasBloqueadas, setConcluidasBloqueadas] = useState<TrilhaConcluida[]>([])
  const [loading, setLoading] = useState(() => getCachedCertificados() === null)

  useEffect(() => {
    async function load() {
      try {
        const [certsData, trilhas] = await Promise.all([
          loadCertificados(),
          loadTrilhas(),
        ])
        setCerts(certsData)
        const certTrilhaIds = new Set(certsData.map((c: Cert) => c.trilha.id))
        setPendentes(trilhas.filter(t => !certTrilhaIds.has(t.id) && t.percentualConcluido > 0 && t.percentualConcluido < 100))
        setConcluidasBloqueadas(trilhas.filter(t => !certTrilhaIds.has(t.id) && t.percentualConcluido === 100))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loadTrilhas, loadCertificados, trilhasRevision])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] pb-[calc(5rem+var(--safe-area-bottom,0px))]">
        <Header title={m.titulo} />
        <div className="max-w-3xl mx-auto px-4 pt-4 space-y-6">
          <CertsSkeleton />
        </div>
        <NavBottom />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080a0f] pb-[calc(5rem+var(--safe-area-bottom,0px))]">
      <Header title={m.titulo} />

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-6">
        {!isPro && (
          <div className="rounded-2xl bg-[#0f1117] border border-[#8b5cf6]/30 p-5 space-y-3 text-center">
            <div className="text-4xl">🏅</div>
            <h3 className="text-white font-bold">{m.proTitulo}</h3>
            <p className="text-white/50 text-sm">{m.proDesc}</p>
            <Button onClick={() => router.push('/upgrade')} fullWidth>
              {m.assinarPro}
            </Button>
          </div>
        )}

        {certs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wide">{m.conquistados}</h2>
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
            <p className="text-white/40">{m.semCerts}</p>
          </div>
        )}

        {!isPro && concluidasBloqueadas.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wide">{m.conquistados}</h2>
            {concluidasBloqueadas.map(trilha => (
              <div key={trilha.id} className="relative rounded-2xl overflow-hidden bg-[#0f1117] border border-[#2a2d3a]">
                {/* Overlay de bloqueio */}
                <div className="absolute inset-0 bg-[#080a0f]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 rounded-2xl">
                  <div className="text-4xl">🔒</div>
                  <p className="text-white/70 text-sm font-medium text-center px-4">
                    Certificados disponíveis no Pro
                  </p>
                  <button
                    onClick={() => router.push('/upgrade')}
                    className="px-4 py-2 rounded-xl bg-[#8b5cf6] text-white text-sm font-semibold hover:bg-[#7c3aed] transition-colors"
                  >
                    Assinar Pro
                  </button>
                </div>

                {/* Conteúdo do certificado (visível embaixo do blur) */}
                <div className="bg-gradient-to-br from-[#161820] to-[#0a0c12] p-6 space-y-4">
                  <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #8b5cf6 0, #8b5cf6 1px, transparent 0, transparent 50%)',
                      backgroundSize: '12px 12px',
                    }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#a78bfa] font-bold text-sm">SQLQuest</span>
                      <span className="text-white/30 text-xs">CERTIFICADO DE CONCLUSÃO</span>
                    </div>
                    <div className="border-t border-[#8b5cf6]/20 pt-4 space-y-2">
                      <p className="text-white/50 text-xs">Certificamos que</p>
                      <p className="text-white text-xl font-bold">{user?.name ?? 'Usuário'}</p>
                      <p className="text-white/50 text-xs">concluiu com sucesso o curso</p>
                      <p className="text-[#a78bfa] font-bold text-base">{trilha.icone} {trilha.titulo}</p>
                    </div>
                    <div className="border-t border-[#2a2d3a] mt-4 pt-3 flex justify-between">
                      <div>
                        <p className="text-white/30 text-[10px]">Data de emissão</p>
                        <p className="text-white/70 text-xs font-medium">— —</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/30 text-[10px]">Código</p>
                        <p className="text-white/70 text-xs font-mono">— — — —</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pendentes.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white/40 text-sm font-semibold uppercase tracking-wide">{m.emAndamento}</h2>
            {pendentes.map(t => (
              <button
                key={t.id}
                onClick={() => router.push(`/trilha/${t.slug}`)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0f1117] border border-[#1e2028] text-left hover:border-[#2a2d3a] transition-colors"
              >
                <span className="text-3xl">{t.icone}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{t.titulo}</p>
                  <p className="text-white/40 text-xs">{t.percentualConcluido}% {m.concluido}</p>
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
