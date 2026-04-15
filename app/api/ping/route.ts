import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  await prisma.$queryRaw`SELECT 1`
  return Response.json({ ok: true })
}
