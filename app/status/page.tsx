import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Status — SQLQuest',
  description: 'Status operacional do SQLQuest.',
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-[#a78bfa] hover:underline">
          ← Voltar ao início
        </Link>

        <section className="py-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
          </div>
          <h1 className="text-3xl font-bold">SQLQuest operacional</h1>
          <p className="mt-3 text-white/55">
            A plataforma está disponível. Caso encontre instabilidade, entre em contato pelo suporte.
          </p>
        </section>

        <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-sm text-white/60">Site e app</span>
            <span className="text-sm font-bold text-emerald-300">Operacional</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 py-3">
            <span className="text-sm text-white/60">Login e progresso</span>
            <span className="text-sm font-bold text-emerald-300">Operacional</span>
          </div>
          <div className="flex items-center justify-between pt-3">
            <span className="text-sm text-white/60">Pagamentos</span>
            <span className="text-sm font-bold text-emerald-300">Operacional</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/35">
          Suporte:{' '}
          <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
            suporte@sqlquest.com.br
          </a>
        </p>
      </main>
    </div>
  )
}
