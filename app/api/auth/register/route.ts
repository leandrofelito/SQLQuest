import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { contemPalavrão } from '@/lib/nickname'

const schema = z.object({
  firstName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(25),
  lastName: z.string().min(2, 'Sobrenome deve ter ao menos 2 caracteres').max(25),
  nickname: z
    .string()
    .min(3, 'Nickname deve ter ao menos 3 caracteres')
    .max(20, 'Nickname deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nickname só pode conter letras, números e underscore'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .max(72, 'Senha muito longa')
    .refine(p => /[A-Z]/.test(p), 'Senha deve conter ao menos uma letra maiúscula')
    .refine(p => /[a-z]/.test(p), 'Senha deve conter ao menos uma letra minúscula')
    .refine(p => /[0-9]/.test(p), 'Senha deve conter ao menos um número')
    .refine(p => /[^A-Za-z0-9]/.test(p), 'Senha deve conter ao menos um caractere especial'),
})

export async function POST(req: Request) {
  const body = await req.json()

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.errors[0].message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { firstName, lastName, nickname, email, password } = parsed.data
  const name = `${firstName} ${lastName}`

  if (contemPalavrão(nickname)) {
    return NextResponse.json({ error: 'Este nickname não é permitido' }, { status: 400 })
  }

  const [existenteEmail, existenteNick] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { nickname } }),
  ])

  if (existenteEmail) {
    return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 })
  }
  if (existenteNick) {
    return NextResponse.json({ error: 'Este nickname já está em uso' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, nickname, email, password: hash },
  })

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  sendVerificationEmail(email, name, token).catch(() => {})

  return NextResponse.json({ ok: true })
}
