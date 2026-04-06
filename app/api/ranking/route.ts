import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { totalXp: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      image: true,
      totalXp: true,
      streak: true,
      prestige: true,
    },
  })

  return NextResponse.json(users)
}
