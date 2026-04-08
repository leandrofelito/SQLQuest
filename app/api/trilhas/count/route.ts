import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const total = await prisma.trilha.count({ where: { publicada: true } })
  return NextResponse.json({ total })
}
