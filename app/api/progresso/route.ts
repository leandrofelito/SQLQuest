import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST foi migrado para features/learning/actions/progress.actions.ts (Server Action).
// Este arquivo mantém apenas o GET, usado pelo AppDataContext para cache offline via IDB.

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const trilhaId = searchParams.get('trilhaId')

  const where = trilhaId ? { userId, trilhaId } : { userId }
  const progressos = await prisma.progresso.findMany({ where })
  return NextResponse.json(progressos)
}
