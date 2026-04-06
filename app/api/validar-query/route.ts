import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { assinarToken } from '@/lib/validacao-token'
import { checkAnswer } from '@/lib/check-answer'
import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import type { ConteudoExercicio } from '@/types'

const schema = z.object({
  etapaId: z.string(),
  query: z.string().min(1).max(2000),
  tentativas: z.number().int().min(1).max(99),
  dicasUsadas: z.number().int().min(0).max(10),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id

  // Anti-bot: max 3 submissions per 5 seconds per user
  const rl = checkRateLimit(`validar:${userId}`, 3, 5000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns segundos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    )
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  const body = parsed.data

  // The server is the sole authority on what constitutes a correct answer.
  // We load the exercise directly from the DB — the client never sends the answer key.
  const etapa = await prisma.etapa.findUnique({
    where: { id: body.etapaId },
    select: { tipo: true, conteudo: true },
  })

  if (!etapa || etapa.tipo !== 'exercicio') {
    return NextResponse.json({ error: 'Exercício não encontrado' }, { status: 404 })
  }

  const conteudo = etapa.conteudo as unknown as ConteudoExercicio

  // Run the user's query inside an isolated in-memory SQLite sandbox.
  // This database has ZERO connection to the main Neon/PostgreSQL database.
  // Even a DROP TABLE or DELETE FROM inside the user's query only affects
  // the throwaway in-memory instance that is destroyed after validation.
  let sucesso = false
  try {
    const wasmPath = path.join(process.cwd(), 'public', 'sql-wasm.wasm')
    const wasmBuffer = fs.readFileSync(wasmPath)
    const wasmBinary = wasmBuffer.buffer.slice(
      wasmBuffer.byteOffset,
      wasmBuffer.byteOffset + wasmBuffer.byteLength
    ) as ArrayBuffer
    const SQL = await initSqlJs({ wasmBinary })
    const db = new SQL.Database()

    try {
      // Populate exercise sandbox with the official schema + seed data
      db.run(conteudo.schema)
      // Execute the user's query (any DDL/DML only affects this throwaway DB)
      const resultado = db.exec(body.query)
      sucesso = checkAnswer(resultado as any, conteudo.checkType, conteudo.checkConfig)
    } finally {
      db.close()
    }
  } catch {
    // Syntax errors, runtime errors — not a correct answer
    return NextResponse.json({ sucesso: false, erro: 'Erro ao executar a query' })
  }

  if (!sucesso) {
    return NextResponse.json({ sucesso: false })
  }

  // Issue a short-lived HMAC-signed token.
  // Only the server (holding NEXTAUTH_SECRET) can produce this token.
  // The /api/progresso endpoint verifies it before granting any XP.
  // tentativas and dicasUsadas are sealed inside — the client cannot inflate them.
  const token = assinarToken({
    userId,
    etapaId: body.etapaId,
    tentativas: body.tentativas,
    dicasUsadas: body.dicasUsadas,
    exp: Date.now() + 10 * 60 * 1000, // expires in 10 minutes
  })

  return NextResponse.json({ sucesso: true, token })
}
