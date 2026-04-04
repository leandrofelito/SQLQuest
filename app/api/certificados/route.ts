import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id

  const certificados = await prisma.certificado.findMany({
    where: { userId },
    include: { trilha: { select: { id: true, slug: true, titulo: true, icone: true } } },
    orderBy: { emitidoEm: 'desc' },
  })

  return NextResponse.json(certificados)
}
