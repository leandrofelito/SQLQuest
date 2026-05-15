import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatData } from '@/lib/utils'

interface CertPageProps {
  params: { hash: string }
}

export default async function CertPage({ params }: CertPageProps) {
  const cert = await prisma.certificado.findFirst({
    where: { hash: { startsWith: params.hash } },
    include: {
      user: { select: { name: true } },
      trilha: { select: { titulo: true, icone: true, slug: true } },
    },
  })

  if (!cert) notFound()

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col items-center justify-center px-6 py-12">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-10 w-10" />
            <span className="text-2xl font-bold text-[#a78bfa]">SQL<span className="text-[#facc15]">Quest</span></span>
          </div>
          <div className="text-white/30 text-xs uppercase tracking-widest">Verificação de Certificado</div>
        </div>

        {/* Card Certificado */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#161820] to-[#0a0c12] rounded-3xl border border-[#8b5cf6]/30 p-8 space-y-6 shadow-2xl">
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#facc15]" />
          {/* Ícone válido */}
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.18)]">
              <span className="text-3xl">✓</span>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-white/50 text-sm">Certificamos que</p>
            <p className="text-white text-2xl font-bold">{cert.user.name ?? 'Usuário'}</p>
            <p className="text-white/50 text-sm">concluiu com sucesso o curso</p>
            <p className="text-[#a78bfa] font-bold text-lg">{cert.trilha.icone} {cert.trilha.titulo}</p>
          </div>

          <div className="border-t border-[#2a2d3a] pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/30 text-xs mb-0.5">Data de emissão</p>
              <p className="text-white/80 text-sm font-medium">{formatData(cert.emitidoEm)}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-0.5">Código</p>
              <p className="text-white/80 text-sm font-mono">{cert.hash.substring(0, 12).toUpperCase()}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
            <p className="text-xs leading-relaxed text-white/45">
              Documento verificável por link público. A validação consulta diretamente a base do SQLQuest.
            </p>
          </div>
        </div>

        {/* Autenticidade */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-emerald-300 font-semibold text-sm">✓ Certificado Autêntico</p>
          <p className="text-white/30 text-xs mt-1">
            Verificado em {new Date().toLocaleDateString('pt-BR')} via SQLQuest
          </p>
        </div>

        <p className="text-center text-white/20 text-xs">
          Este certificado foi emitido pela plataforma SQLQuest e sua autenticidade pode ser verificada a qualquer momento por este link.
        </p>
      </div>
    </div>
  )
}
