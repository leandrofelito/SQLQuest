import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { applyLocale, type Locale, DEFAULT_LOCALE } from '@/lib/locale'

function localizeEtapa(etapa: any, lang: Locale) {
  const base = { titulo: etapa.titulo, conteudo: etapa.conteudo }
  const localized = applyLocale(base, etapa.traducoes as Record<string, Partial<typeof base>> | null, lang)
  return { ...etapa, ...localized }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const trilhaSlug = searchParams.get('trilhaSlug')
  const ordem = searchParams.get('ordem')
  const lang = (searchParams.get('lang') ?? DEFAULT_LOCALE) as Locale

  if (id) {
    const etapa = await prisma.etapa.findUnique({ where: { id } })
    if (!etapa) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })
    return NextResponse.json(localizeEtapa(etapa, lang))
  }

  if (trilhaSlug && ordem) {
    const trilha = await prisma.trilha.findUnique({ where: { slug: trilhaSlug } })
    if (!trilha) return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })

    const etapa = await prisma.etapa.findUnique({
      where: { trilhaId_ordem: { trilhaId: trilha.id, ordem: parseInt(ordem) } },
    })
    if (!etapa) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })
    return NextResponse.json(localizeEtapa(etapa, lang))
  }

  return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
}
