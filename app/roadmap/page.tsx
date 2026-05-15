import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Roadmap — SQLQuest',
  description: 'Veja os próximos passos planejados para o SQLQuest.',
}

const itens = [
  {
    fase: 'Agora',
    titulo: 'Mais dicas progressivas',
    desc: 'Expandir pistas em exercícios para transformar erro em aprendizado guiado.',
  },
  {
    fase: 'Próximo',
    titulo: 'Novas trilhas avançadas',
    desc: 'Aprofundar performance, modelagem, segurança e SQL para entrevistas técnicas.',
  },
  {
    fase: 'Próximo',
    titulo: 'Experiência mobile mais fluida',
    desc: 'Refinar atalhos de SQL, leitura em telas pequenas e compartilhamento de certificados.',
  },
  {
    fase: 'Depois',
    titulo: 'Projetos práticos',
    desc: 'Criar desafios maiores com datasets, relatórios e cenários mais próximos do trabalho real.',
  },
]

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-[#a78bfa] hover:underline">
          ← Voltar ao início
        </Link>

        <section className="py-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#a78bfa]">Roadmap</p>
          <h1 className="text-3xl font-bold md:text-5xl">O que vem por aí</h1>
          <p className="mt-4 max-w-2xl text-white/55">
            O SQLQuest evolui em torno de uma ideia simples: aprender SQL precisa ser prático,
            progressivo e recompensador.
          </p>
        </section>

        <div className="space-y-4">
          {itens.map(item => (
            <article key={item.titulo} className="rounded-2xl border border-white/10 bg-[#0f1117] p-5">
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/15 px-3 py-1 text-xs font-bold text-[#c4b5fd]">
                  {item.fase}
                </span>
                <h2 className="font-bold text-white">{item.titulo}</h2>
              </div>
              <p className="text-sm leading-relaxed text-white/55">{item.desc}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
