import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
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
