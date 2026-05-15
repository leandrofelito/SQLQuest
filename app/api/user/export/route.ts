import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      nickname: true,
      image: true,
      isPro: true,
      isAdmin: true,
      proAt: true,
      totalXp: true,
      xpRanking: true,
      streak: true,
      prestige: true,
      language_preference: true,
      lastActiveAt: true,
      createdAt: true,
      updatedAt: true,
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
          type: true,
        },
      },
      progressos: {
        select: {
          trilhaId: true,
          etapaId: true,
          xpGanho: true,
          tentativas: true,
          usouDica: true,
          estrelas: true,
          concluidaEm: true,
          trilha: { select: { slug: true, titulo: true } },
          etapa: { select: { ordem: true, tipo: true, titulo: true } },
        },
        orderBy: { concluidaEm: 'desc' },
      },
      pagamentos: {
        select: {
          id: true,
          stripeSessionId: true,
          valor: true,
          status: true,
          criadoEm: true,
        },
        orderBy: { criadoEm: 'desc' },
      },
      certificados: {
        select: {
          hash: true,
          emitidoEm: true,
          trilha: { select: { slug: true, titulo: true } },
        },
        orderBy: { emitidoEm: 'desc' },
      },
      conquistasRanking: {
        select: {
          tipo: true,
          posicao: true,
          alcancadaEm: true,
        },
        orderBy: { alcancadaEm: 'desc' },
      },
      trilhasDesbloqueadas: {
        select: {
          criadaEm: true,
          trilha: { select: { slug: true, titulo: true } },
        },
        orderBy: { criadaEm: 'desc' },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json(
    {
      exportadoEm: new Date().toISOString(),
      controlador: 'SQLQuest',
      observacao:
        'Exportação dos dados associados à sua conta. Senha, tokens de sessão e tokens OAuth não são incluídos por segurança.',
      dados: user,
    },
    {
      headers: {
        'Content-Disposition': 'attachment; filename="sqlquest-meus-dados.json"',
        'Cache-Control': 'no-store',
      },
    },
  )
}
