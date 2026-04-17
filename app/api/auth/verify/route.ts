import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(req: Request) {
  // 10 tentativas de verificação por IP a cada hora — tokens são difíceis de adivinhar,
  // mas limitar evita varredura automatizada.
  const ip = getClientIp(req)
  const rl = checkRateLimit(`verify:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/login?error=Verification`)
  }

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=Verification`)
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.redirect(`${baseUrl}/login?error=Verification`)
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.redirect(`${baseUrl}/login?error=Verification`)
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.redirect(`${baseUrl}/login?verified=1`)
}
