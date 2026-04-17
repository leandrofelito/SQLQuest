import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Em manutenção — SQLQuest',
  description: 'O SQLQuest está em manutenção programada. Voltaremos em breve com melhorias.',
  robots: { index: false, follow: false },
}

export default function ManutencaoPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white font-syne">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-8">🔧</div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          SQLQuest em manutenção
        </h1>

        <p className="text-white/55 text-base leading-relaxed mb-8 max-w-md mx-auto">
          Estamos realizando uma manutenção programada para melhorar a plataforma. O serviço será restabelecido em breve.
        </p>

        <div className="bg-[#0f1117] border border-white/5 rounded-2xl p-6 mb-10 text-left space-y-4">
          <h2 className="text-white font-semibold text-sm">O que é o SQLQuest?</h2>
          <p className="text-white/55 text-sm leading-relaxed">
            SQLQuest é uma plataforma educacional gamificada para aprender SQL do básico ao avançado. Com 12 trilhas de aprendizado, sistema de XP, ranking global e certificados verificáveis, tornamos o aprendizado de SQL eficiente e motivador.
          </p>
          <p className="text-white/55 text-sm leading-relaxed">
            Durante a manutenção, novos cadastros e o acesso ao conteúdo estão temporariamente indisponíveis. Agradecemos sua paciência.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Voltar ao início
          </Link>
          <p className="text-white/30 text-xs mt-4">
            Dúvidas? Entre em contato:{' '}
            <a href="mailto:suporte@sqlquest.com.br" className="text-[#a78bfa] hover:underline">
              suporte@sqlquest.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
