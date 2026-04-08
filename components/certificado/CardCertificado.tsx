'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatData } from '@/lib/utils'

interface CardCertificadoProps {
  certificado: {
    id: string
    hash: string
    emitidoEm: Date | string
    trilha: {
      id: string
      slug: string
      titulo: string
      icone: string
    }
  }
  userName: string
  isPro: boolean
}

export function CardCertificado({ certificado, userName, isPro }: CardCertificadoProps) {
  const router = useRouter()
  const [baixando, setBaixando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const emitidoEm = new Date(certificado.emitidoEm)

  async function baixarPDF() {
    setBaixando(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const elemento = document.getElementById('certificado-card')
      if (!elemento) throw new Error('Elemento não encontrado')

      await html2pdf()
        .set({
          margin: 0,
          filename: `certificado-sqlquest-${certificado.trilha.slug}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 3, useCORS: true, backgroundColor: '#0f1117' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        })
        .from(elemento)
        .save()
    } catch {
      alert('Não foi possível baixar o certificado. Tente novamente.')
    } finally {
      setBaixando(false)
    }
  }

  async function compartilhar() {
    const url = `${process.env.NEXT_PUBLIC_URL ?? window.location.origin}/cert/${certificado.hash}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Certificado SQLQuest — ${certificado.trilha.titulo}`, url })
      } catch {
        // usuário cancelou ou erro — tenta copiar
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
      } catch {
        alert(`Link: ${url}`)
      }
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-[#0f1117] border border-[#2a2d3a]">
      {/* Overlay blur para free users */}
      {!isPro && (
        <div className="absolute inset-0 bg-[#080a0f]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 rounded-2xl">
          <div className="text-4xl">🔒</div>
          <p className="text-white/70 text-sm font-medium text-center px-4">
            Certificados disponíveis no Pro
          </p>
          <Button onClick={() => router.push('/upgrade')} size="sm">
            Assinar Pro
          </Button>
        </div>
      )}

      {/* Certificado visual */}
      <div id="certificado-card" className="bg-gradient-to-br from-[#161820] to-[#0a0c12] p-6 space-y-4">
        {/* Grid decorativo */}
        <div className="absolute inset-0 opacity-5"
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
            <p className="text-white text-xl font-bold">{userName}</p>
            <p className="text-white/50 text-xs">concluiu com sucesso o curso</p>
            <p className="text-[#a78bfa] font-bold text-base">{certificado.trilha.icone} {certificado.trilha.titulo}</p>
          </div>

          <div className="border-t border-[#2a2d3a] mt-4 pt-3 flex justify-between">
            <div>
              <p className="text-white/30 text-[10px]">Data de emissão</p>
              <p className="text-white/70 text-xs font-medium">{formatData(emitidoEm)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/30 text-[10px]">Código</p>
              <p className="text-white/70 text-xs font-mono">{certificado.hash.substring(0, 12).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      {isPro && (
        <div className="flex gap-2 p-4 border-t border-[#1e2028]">
          <Button onClick={baixarPDF} loading={baixando} size="sm" fullWidth variant="secondary">
            ⬇ Baixar PDF
          </Button>
          <Button onClick={compartilhar} size="sm" fullWidth variant="ghost">
            {copiado ? '✅ Link copiado!' : '🔗 Compartilhar'}
          </Button>
        </div>
      )}
    </div>
  )
}
