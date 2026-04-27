import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog SQL — Tutoriais e Guias Práticos | SQLQuest',
  description:
    'Aprenda SQL com tutoriais gratuitos em português. SELECT, WHERE, JOINs, GROUP BY, subqueries e muito mais — explicados do zero com exemplos reais.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Blog SQL — Tutoriais e Guias Práticos | SQLQuest',
    description: 'Tutoriais gratuitos de SQL em português, do básico ao avançado.',
    type: 'website',
  },
}

const TAG_COLORS: Record<string, string> = {
  iniciante: 'bg-emerald-500/15 text-emerald-400',
  intermediário: 'bg-blue-500/15 text-blue-400',
  avançado: 'bg-purple-500/15 text-purple-400',
  fundamentos: 'bg-yellow-500/15 text-yellow-400',
  joins: 'bg-orange-500/15 text-orange-400',
  select: 'bg-cyan-500/15 text-cyan-400',
  filtros: 'bg-pink-500/15 text-pink-400',
  where: 'bg-pink-500/15 text-pink-400',
  'group-by': 'bg-indigo-500/15 text-indigo-400',
  agregação: 'bg-indigo-500/15 text-indigo-400',
  subqueries: 'bg-violet-500/15 text-violet-400',
  cte: 'bg-violet-500/15 text-violet-400',
  relacionamentos: 'bg-orange-500/15 text-orange-400',
}

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-white/10 text-white/60'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-[#080a0f] text-white/90">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
            ← SQLQuest
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-1.5 rounded-lg bg-[#a78bfa]/15 text-[#a78bfa] hover:bg-[#a78bfa]/25 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Blog SQL</h1>
          <p className="text-white/55 text-base leading-relaxed max-w-2xl">
            Tutoriais gratuitos de SQL em português. Aprenda desde os fundamentos até técnicas avançadas usadas no
            mercado — com exemplos práticos e explicações diretas.
          </p>
        </div>

        {/* Posts grid */}
        <div className="grid gap-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl border border-white/8 bg-white/[0.03] p-6 hover:border-[#a78bfa]/40 hover:bg-[#a78bfa]/5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-lg font-semibold text-white group-hover:text-[#a78bfa] transition-colors leading-snug">
                  {post.title}
                </h2>
                <span className="text-white/30 text-sm shrink-0 mt-0.5">{post.readTime} min</span>
              </div>

              <p className="text-sm text-white/55 leading-relaxed mb-4">{post.description}</p>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-white/35">{formatDate(post.date)}</span>
                <span className="text-white/20">·</span>
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map((tag) => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/5 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Aprenda SQL praticando</h2>
          <p className="text-white/55 text-sm mb-6 max-w-md mx-auto">
            Ler sobre SQL ajuda, mas nada substitui escrever queries de verdade. No SQLQuest você pratica com exercícios
            interativos e feedback imediato.
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-2.5 rounded-lg bg-[#a78bfa] text-[#080a0f] font-semibold text-sm hover:bg-[#c4b5fd] transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-between items-center text-xs text-white/30">
          <span>© {new Date().getFullYear()} SQLQuest</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white/60 transition-colors">Início</Link>
            <Link href="/sobre" className="hover:text-white/60 transition-colors">Sobre</Link>
            <Link href="/privacidade" className="hover:text-white/60 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-white/60 transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
