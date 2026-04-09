import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { contemPalavrão } from '@/lib/nickname'

const schema = z.object({
  nickname: z
    .string()
    .min(3, 'Nickname deve ter ao menos 3 caracteres')
    .max(20, 'Nickname deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nickname só pode conter letras, números e underscore'),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { nickname } = parsed.data

  if (contemPalavrão(nickname)) {
    return NextResponse.json({ error: 'Este nickname não é permitido' }, { status: 400 })
  }

  const existente = await prisma.user.findUnique({ where: { nickname } })
  if (existente && existente.id !== userId) {
    return NextResponse.json({ error: 'Este nickname já está em uso' }, { status: 409 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { nickname },
  })

  return NextResponse.json({ ok: true })
}
