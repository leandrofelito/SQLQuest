import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(80),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export async function POST(req: Request) {
  const body = await req.json()

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.errors[0].message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { name, email, password } = parsed.data

  const existente = await prisma.user.findUnique({ where: { email } })
  if (existente) {
    return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, password: hash },
  })

  // Generate verification token (valid for 24h)
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  // Send verification email (non-blocking)
  sendVerificationEmail(email, name, token).catch(() => {})

  return NextResponse.json({ ok: true })
}
