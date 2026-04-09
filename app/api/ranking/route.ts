import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { totalXp: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        nickname: true,
        image: true,
        totalXp: true,
        streak: true,
        prestige: true,
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Ranking fetch error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
