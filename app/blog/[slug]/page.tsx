import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: `${post.title} | SQLQuest`,
    description: post.description,
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug)
  const prev = allPosts[currentIndex + 1] ?? null
  const next = allPosts[currentIndex - 1] ?? null

  return (
    <div className="min-h-screen bg-[#080a0f] text-white/90">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/blog" className="text-sm text-white/50 hover:text-white transition-colors">
            ← Blog
          </Link>
          <Link href="/" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
            SQLQuest
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 pb-24">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#a78bfa]/15 text-[#a78bfa] font-medium">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4">{post.title}</h1>
          <p className="text-white/55 text-base leading-relaxed mb-5">{post.description}</p>
          <div className="flex items-center gap-3 text-sm text-white/35">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>·</span>
            <span>{post.readTime} min de leitura</span>
          </div>
        </header>

        <hr className="border-white/8 mb-10" />

        {/* Content */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA inline */}
        <div className="my-12 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/5 p-6 text-center">
          <p className="text-sm text-white/70 mb-3">
            Quer praticar o que aprendeu aqui? O SQLQuest tem exercícios interativos com feedback imediato.
          </p>
          <Link
            href="/register"
            className="inline-block px-5 py-2 rounded-lg bg-[#a78bfa] text-[#080a0f] font-semibold text-sm hover:bg-[#c4b5fd] transition-colors"
          >
            Praticar SQL grátis →
          </Link>
        </div>

        {/* Prev / Next */}
        {(prev || next) && (
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="block rounded-xl border border-white/8 bg-white/[0.03] p-5 hover:border-[#a78bfa]/40 transition-colors"
              >
                <p className="text-xs text-white/35 mb-1">← Anterior</p>
                <p className="text-sm font-semibold text-white leading-snug">{prev.title}</p>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="block rounded-xl border border-white/8 bg-white/[0.03] p-5 hover:border-[#a78bfa]/40 transition-colors text-right"
              >
                <p className="text-xs text-white/35 mb-1">Próximo →</p>
                <p className="text-sm font-semibold text-white leading-snug">{next.title}</p>
              </Link>
            ) : <div />}
          </nav>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-between items-center text-xs text-white/30">
          <span>© {new Date().getFullYear()} SQLQuest</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white/60 transition-colors">Início</Link>
            <Link href="/blog" className="hover:text-white/60 transition-colors">Blog</Link>
            <Link href="/sobre" className="hover:text-white/60 transition-colors">Sobre</Link>
            <Link href="/privacidade" className="hover:text-white/60 transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
