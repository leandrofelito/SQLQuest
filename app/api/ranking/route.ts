import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { xpRanking: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        nickname: true,
        image: true,
        totalXp: true,
        xpRanking: true,
        streak: true,
        prestige: true,
      },
    })

    return NextResponse.json(users, {
      headers: {
        // Client may use cached response for up to 3 minutes
        'Cache-Control': 'private, max-age=180, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Ranking fetch error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
