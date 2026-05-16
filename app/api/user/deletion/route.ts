import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelAccountDeletion, requestAccountDeletion } from '@/lib/account-deletion'
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
      deletionRequestedAt: true,
      deletionScheduledAt: true,
    },
  })

  return NextResponse.json({
    deletionRequestedAt: user?.deletionRequestedAt ?? null,
    deletionScheduledAt: user?.deletionScheduledAt ?? null,
  })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const result = await requestAccountDeletion(userId)

  if (!result) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    deletionRequestedAt: result.deletionRequestedAt,
    deletionScheduledAt: result.deletionScheduledAt,
  })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const result = await cancelAccountDeletion(userId)

  return NextResponse.json({
    ok: true,
    deletionRequestedAt: result.deletionRequestedAt,
    deletionScheduledAt: result.deletionScheduledAt,
  })
}
