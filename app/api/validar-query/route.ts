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
import { isQuizExercicio, isSqlExercicio } from '@/types'

// Module-level cache: evita recarregar o WASM a cada request (especialmente cold starts)
let _sqlJsCache: any = null
let _sqlJsPromise: Promise<any> | null = null

async function getSqlJs(): Promise<any> {
  if (_sqlJsCache) return _sqlJsCache
  if (_sqlJsPromise) return _sqlJsPromise
  _sqlJsPromise = (async () => {
    const wasmPath = path.join(process.cwd(), 'public', 'sql-wasm.wasm')
    const wasmBuffer = fs.readFileSync(wasmPath)
    const wasmBinary = wasmBuffer.buffer.slice(
      wasmBuffer.byteOffset,
      wasmBuffer.byteOffset + wasmBuffer.byteLength
    ) as ArrayBuffer
    const SQL = await initSqlJs({ wasmBinary })
    _sqlJsCache = SQL
    return SQL
  })()
  return _sqlJsPromise
}

const baseBodySchema = z.object({
  etapaId: z.string(),
  tentativas: z.number().int().min(1).max(99),
  dicasUsadas: z.number().int().min(0).max(10),
  query: z.string().max(2000).optional(),
  indiceEscolhido: z.number().int().min(0).max(25).optional(),
  valorVF: z.boolean().optional(),
  textoReflexao: z.string().max(1000).optional(),
})

function emitirToken(
  userId: string,
  etapaId: string,
  tentativas: number,
  dicasUsadas: number
) {
  return assinarToken({
    userId,
    etapaId,
    tentativas,
    dicasUsadas,
    exp: Date.now() + 10 * 60 * 1000,
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id

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

  const raw = await req.json()
  const parsed = baseBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  const body = parsed.data

  const etapa = await prisma.etapa.findUnique({
    where: { id: body.etapaId },
    select: { tipo: true, conteudo: true },
  })

  if (!etapa || etapa.tipo !== 'exercicio') {
    return NextResponse.json({ error: 'Exercício não encontrado' }, { status: 404 })
  }

  const conteudo = etapa.conteudo as unknown as ConteudoExercicio

  let sucesso = false

  if (isQuizExercicio(conteudo)) {
    switch (conteudo.quizTipo) {
      case 'multipla': {
        if (body.indiceEscolhido === undefined) {
          return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }
        const n = conteudo.opcoes.length
        if (n === 0 || body.indiceEscolhido < 0 || body.indiceEscolhido >= n) {
          return NextResponse.json({ sucesso: false })
        }
        sucesso = body.indiceEscolhido === conteudo.indiceCorreto
        break
      }
      case 'vf': {
        if (body.valorVF === undefined) {
          return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }
        sucesso = body.valorVF === conteudo.respostaCorreta
        break
      }
      case 'reflexao': {
        if (body.textoReflexao === undefined) {
          return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
        }
        const len = body.textoReflexao.trim().length
        const min = Math.max(1, Math.min(conteudo.minLength, 1000))
        sucesso = len >= min
        break
      }
      default:
        return NextResponse.json({ sucesso: false })
    }
  } else if (isSqlExercicio(conteudo)) {
    const q = body.query
    if (!q || !q.trim()) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    try {
      const SQL = await getSqlJs()
      const db = new SQL.Database()

      try {
        db.run(conteudo.schema)
        const resultado = db.exec(q)
        sucesso = checkAnswer(resultado as any, conteudo.checkType, conteudo.checkConfig)
      } finally {
        db.close()
      }
    } catch {
      return NextResponse.json({ sucesso: false, erro: 'Erro ao executar a query' })
    }
  } else {
    return NextResponse.json({ sucesso: false })
  }

  if (!sucesso) {
    return NextResponse.json({ sucesso: false })
  }

  const token = emitirToken(userId, body.etapaId, body.tentativas, body.dicasUsadas)

  return NextResponse.json({ sucesso: true, token })
}
